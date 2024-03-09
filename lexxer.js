
const tokenType = {
    START_PROGRAM: 0,
    END_PROGRAM: 1,
    IDENT: 2,
    LITERAL: 3,
    SEMICOLON: 4,
    ASSIGN: 5,
    ADD_OP: 6,
    SUBTRACT_OP: 7,
    MULTIPLY_OP: 8,
    DIVIDE_OP: 9,
    MOD_OP: 10,
    OPEN_PAREN: 11,
    CLOSE_PAREN: 12,
    START_CONDITIONAL: 13,
    START_LOOP: 14,
    END_LOOP: 15,
    EQUAL_LOGIC: 16,
    NOT_EQUAL_LOGIC: 17,
    GREATER_THAN_LOGIC: 18,
    LESS_THAN_LOGIC: 19,
    GREATER_THAN_EQUAL_LOGIC: 20,
    LESS_THAN_EQUAL_LOGIC: 21,
    END_CONDITIONAL: 22,
    COLON: 23
};

const tokenTypeMap = new Map([
    ["program", tokenType.START_PROGRAM],
    ["end_program", tokenType.END_PROGRAM],
    [";", tokenType.SEMICOLON],
    [":", tokenType.COLON],
    ["=", tokenType.ASSIGN],
    ["+", tokenType.ADD_OP],
    ["-", tokenType.SUBTRACT_OP],
    ["*", tokenType.MULTIPLY_OP],
    ["/", tokenType.DIVIDE_OP],
    ["%", tokenType.MOD_OP],
    ["(", tokenType.OPEN_PAREN],
    [")", tokenType.CLOSE_PAREN],
    ["if", tokenType.START_CONDITIONAL],
    ["end_if", tokenType.END_CONDITIONAL],
    ["loop", tokenType.START_LOOP],
    ["end_loop", tokenType.END_LOOP],
    ["==", tokenType.EQUAL_LOGIC],
    ["!=", tokenType.NOT_EQUAL_LOGIC],
    [">", tokenType.GREATER_THAN_LOGIC],
    ["<", tokenType.LESS_THAN_LOGIC],
    [">=", tokenType.GREATER_THAN_EQUAL_LOGIC],
    ["<=", tokenType.LESS_THAN_EQUAL_LOGIC],
    ["end", tokenType.END_CONDITIONAL]
]);

const alphanumericRegex = /[a-zA-Z0-9_-]/;
const numericRegex = /[0-9]/;
const alphaRegex = /[a-zA-Z_-]/;

function lex(code) {
    let tokens = [];
    let word = "";
    for(i = 0 ; i < code.length; i++) {
        let char = code[i];
        if(!alphanumericRegex.test(char)) {
            if(word !== "") {
                let token = tokenTypeMap.get(word);
                if(token !== undefined) {
                    tokens.push(tokenTypeMap.get(word));
                } else if (alphaRegex.test(word)) {
                    if(numericRegex.test(word[0])) {
                        throw new Error("Unidentified token: " + word);
                    }
                    tokens.push(tokenType.IDENT);
                } else if (numericRegex.test(word)) {
                    tokens.push(tokenType.LITERAL);
                } else {
                    throw new Error("Unidentified token: " + word);
                }
                word = "";
            }
            if(char === " " || char === "\n" || char === "\t"){
                continue;
            }
            
            if(char === "=" || char === "!" || char === ">" || char === "<"){
                if(code[i + 1] === "=") {
                    const token = tokenTypeMap.get(char + code[i + 1]);
                    if (token !== undefined) {
                        tokens.push(token);
                        i++;
                    }
                } else {
                    tokens.push(tokenTypeMap.get(char));
                }
            } 
            else {
                const token = tokenTypeMap.get(char);
                if (token !== undefined) {
                    tokens.push(token);
                } else {
                    throw new Error("Unidentified token: " + char);
                }
            }

        }else if (alphanumericRegex.test(char)) {
            word += char;
        } else {
            throw new Error("Unidentified token: " + char);
        }

    }
    return tokens;
}

/*
EBNF Grammar:
program = "program" {statement} "end_program";
statement = assignment | conditional | loop;
assignment = "IDENT" "=" expression ";";
conditional = "if" "(" logicExpression ")" {statement} "end_if";
loop = "loop" "(" assignment ":" expression ")" {statement} "end_loop";
logicExpression = term {("==" | ">=" | "<=" | "!=" | "<" |">") term};
expression = term {("+" | "-"| "/" | "%" | "*") term};
term = "IDENT" | "LITERAL" | "(" expression ")";
*/


class RecursiveDescentParser{
    constructor(tokens) {
        this.tokens = tokens;
        this.index = 0;
    }

    parse() {
        this.program();
    }

    match(token) {
        
        if(this.tokens[this.index] === token) {
            this.index++;
        } else {
            throw new Error("Unexpected token: " + Object.keys(tokenType)[this.tokens[this.index]] + " at index: " + this.index + "\nExpected: " + Object.keys(tokenType)[token]);
        }
    }

    program() {
        this.match(tokenType.START_PROGRAM);
        while(this.tokens[this.index] !== tokenType.END_PROGRAM && this.index < this.tokens.length-1) {
            this.statement();
        }
        this.match(tokenType.END_PROGRAM);
    }

    statement() {
        if(this.tokens[this.index] === tokenType.IDENT) {
            this.assignment();
            this.match(tokenType.SEMICOLON);
        } else if(this.tokens[this.index] === tokenType.START_CONDITIONAL) {
            this.conditional();
        } else if(this.tokens[this.index] === tokenType.START_LOOP) {
            this.loop();
        } else {
            throw new Error("Unexpected token in statement: " + Object.keys(tokenType)[this.tokens[this.index]] + " at index: " + this.index);
        }
        
    }

    assignment() {
        this.match(tokenType.IDENT);
        this.match(tokenType.ASSIGN);
        this.expression();
    }

    conditional() {
        this.match(tokenType.START_CONDITIONAL);
        this.match(tokenType.OPEN_PAREN);
        this.logicExpression();
        this.match(tokenType.CLOSE_PAREN);
        while(this.tokens[this.index] !== tokenType.END_CONDITIONAL && this.index < this.tokens.length -1) {
            this.statement();
        }
        this.match(tokenType.END_CONDITIONAL);
    }
    
    loop() {
        this.match(tokenType.START_LOOP);
        this.match(tokenType.OPEN_PAREN);
        this.assignment();
        this.match(tokenType.COLON);
        this.expression();
        this.match(tokenType.CLOSE_PAREN);
        while(this.tokens[this.index] !== tokenType.END_LOOP && this.index < this.tokens.length -1) {
            this.statement();
        }
        this.match(tokenType.END_LOOP);
    }

    logicExpression() {
        this.term();
        
        if(this.tokens[this.index] === tokenType.EQUAL_LOGIC || this.tokens[this.index] === tokenType.NOT_EQUAL_LOGIC || this.tokens[this.index] === tokenType.GREATER_THAN_LOGIC || this.tokens[this.index] === tokenType.LESS_THAN_LOGIC || this.tokens[this.index] === tokenType.GREATER_THAN_EQUAL_LOGIC || this.tokens[this.index] === tokenType.LESS_THAN_EQUAL_LOGIC) {
            this.match(this.tokens[this.index]);
            this.term();
        }else{
            throw new Error("Unexpected token in logicExpression: " + Object.keys(tokenType)[this.tokens[this.index]] + " at index: " + this.index);
        }
    }

    expression() {
        this.term();
        while(this.tokens[this.index] === tokenType.ADD_OP || this.tokens[this.index] === tokenType.SUBTRACT_OP || this.tokens[this.index] === tokenType.MULTIPLY_OP || this.tokens[this.index] === tokenType.DIVIDE_OP || this.tokens[this.index] === tokenType.MOD_OP) {
            this.match(this.tokens[this.index]);
            this.term();
        }
    }

    term() {
        if(this.tokens[this.index] === tokenType.IDENT) {
            this.match(tokenType.IDENT);
        } else if(this.tokens[this.index] === tokenType.LITERAL) {
            this.match(tokenType.LITERAL);
        } else if(this.tokens[this.index] === tokenType.OPEN_PAREN) {
            this.match(tokenType.OPEN_PAREN);
            this.expression();
            this.match(tokenType.CLOSE_PAREN);
        } else {
            throw new Error("Unexpected token in term: " + Object.keys(tokenType)[this.tokens[this.index]] + " at index: " + this.index);
        }
    }



}





function lexInput() {
    
    let input = $("#input").val() + "\n";
    let output = "";
    try {
        let result = lex(input);
        result.forEach(token => {
            output += Object.keys(tokenType)[token] + "\n";
        });
    } catch (e) {
        output = e
    }
    $("#output").text(output);
}

function parseInput() {
    let input = $("#input").val() + "\n";
    let output = "";
    try {
        let result = lex(input);
        let parser = new RecursiveDescentParser(result);
        parser.parse();
        output = "Parse successful";
    } catch (e) {
        output = e
    }
    $("#output").text(output);
}

/*
`
program
value = 32;
mod1 = 45;
z = mod1 / value * (value % 7) + mod1;
loop (i = 0 : value)
z = z + mod1;
end_loop
if (z >= 50)
newValue = 50 / mod1;
x = mod1;
end_if
end_program
`
*/