
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

const alphanumericRegex = /[a-zA-Z0-9_]/;
const numericRegex = /[0-9]/;
const alphaRegex = /[a-zA-Z_-]/;

function lex(code) {
    // Initialize tokens array
    let tokens = [];
    // Initialize word string
    let word = "";
    // Iterate through code string
    for(i = 0 ; i < code.length; i++) {
        // Set current character
        let char = code[i];
        // Check if character is a number or a letter
        if(!alphanumericRegex.test(char)) {
            // Check if word is not empty
            if(word !== "") {
                //if it isnt empty, check if it is a keyword
                let token = tokenTypeMap.get(word);

                if(token !== undefined) {
                    //if it is a keyword, push the token to the tokens array
                    tokens.push(tokenTypeMap.get(word));
                } else if (alphaRegex.test(word)) {
                    //if it is not a keyword, check if it is an identifier, but first make sure it does not start with a number
                    if(numericRegex.test(word[0])) {
                        //if it starts with a number, throw an error
                        throw new Error("Unidentified token: " + word);
                    }
                    //if it is a valid identifier, push the IDENT token to the tokens array
                    tokens.push(tokenType.IDENT);
                } else if (numericRegex.test(word)) {
                    //if it is not an identifier, check if it is a number, if so push the LITERAL token to the tokens array
                    tokens.push(tokenType.LITERAL);
                } else {
                    //if it is not a number or an identifier, or a keyword, throw an error
                    throw new Error("Unidentified token: " + word);
                }
                //reset the word
                word = "";
            }
            //check if the character is a space, tab, or newline, if so, continue to the next iteration
            if(char === " " || char === "\n" || char === "\t"){
                continue;
            }
            
            //check if the character is one of the following special characters that could be followed by an equal sign
            if(char === "=" || char === "!" || char === ">" || char === "<"){
                //check if the next character is an equal sign, if so, push the token to the tokens array and increment the index
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
                //if it is not one of those special characters, check if it is a different special character, if its identified, add it to the tokens array
                const token = tokenTypeMap.get(char);
                if (token !== undefined) {
                    tokens.push(token);
                } else {
                    //if it is not identified, throw an error
                    throw new Error("Unidentified token: " + char);
                }
            }

        }else {
            //if the character is a number or a letter, add it to the word string
            word += char;
        } 

    }
    //return the tokens array
    return tokens;
}

/*
EBNF Grammar:
<program> -> ("program" {statement} "end_program")
<statement> -> <assignment> | <conditional> | <loop>
<assignment> -> "IDENT" "=" <expression> ";"
<conditional> -> ("if" "(" <logicExpression> ")") {<statement>} ("end_if")
<loop> -> "loop" "(" <assignment> ":" <term> ")" {<statement>} "end_loop"
<logicExpression> -> <term> ("==" | ">=" | "<=" | "!=" | "<" |">") <term>
<expression> -> <term> {("+" | "-"| "/" | "%" | "*") <term>}
<term> -> "IDENT" | "LITERAL" | [(] (<expression>|<term>) [)]
*/


class RecursiveDescentParser{
    constructor(tokens) {
        this.tokens = tokens;
        this.index = 0;
    }

    parse() {
        //start parse
        this.program();
    }

    match(token) {
        //mathces the current token with the expected token
        
        if(this.tokens[this.index] === token) {
            //if the current token is the expected token, increment the index
            this.index++;
        } else {
            //if the current token is not the expected token, throw an error
            throw new Error("Unexpected token: " + Object.keys(tokenType)[this.tokens[this.index]] + " at index: " + this.index + "\nExpected: " + Object.keys(tokenType)[token]);
        }
    }

    program() {
        //start of the program
        this.match(tokenType.START_PROGRAM);
        //loop through the statements until the end of the program
        while(this.tokens[this.index] !== tokenType.END_PROGRAM && this.index < this.tokens.length-1) {
            this.statement();
        }
        //match end of the program
        this.match(tokenType.END_PROGRAM);
    }

    statement() {
        //check if the current token is an identifier, if so, it is an assignment
        if(this.tokens[this.index] === tokenType.IDENT) {
            this.assignment();
            //match the semicolon
            this.match(tokenType.SEMICOLON);
        
        //check if the current token is start conditional, if so, it is a conditional   
        } else if(this.tokens[this.index] === tokenType.START_CONDITIONAL) {
            this.conditional();
        
        //check if the current token is start loop, if so, it is a loop
        } else if(this.tokens[this.index] === tokenType.START_LOOP) {
            this.loop();
        } else {
            //if the current token is not an identifier, start conditional, or start loop, throw an error
            throw new Error("Unexpected token in statement: " + Object.keys(tokenType)[this.tokens[this.index]] + " at index: " + this.index);
        }
        
    }

    assignment() {
        //match the identifier, the assignment operator, and the expression
        this.match(tokenType.IDENT);
        this.match(tokenType.ASSIGN);
        this.expression();
    }

    conditional() {
        //match the start conditional, open paren, logic expression, and close paren
        this.match(tokenType.START_CONDITIONAL);
        this.match(tokenType.OPEN_PAREN);
        this.logicExpression();
        this.match(tokenType.CLOSE_PAREN);
        //loop through the statements until the end of the conditional
        while(this.tokens[this.index] !== tokenType.END_CONDITIONAL && this.index < this.tokens.length -1) {
            this.statement();
        }
        //match the end of the conditional
        this.match(tokenType.END_CONDITIONAL);
    }
    
    loop() {
        //match the start loop, open paren, assignment, colon, expression, and close paren
        this.match(tokenType.START_LOOP);
        this.match(tokenType.OPEN_PAREN);
        this.assignment();
        this.match(tokenType.COLON);
        this.expression();
        this.match(tokenType.CLOSE_PAREN);
        //loop through the statements until the end of the loop
        while(this.tokens[this.index] !== tokenType.END_LOOP && this.index < this.tokens.length -1) {
            this.statement();
        }
        //match the end of the loop
        this.match(tokenType.END_LOOP);
    }

    logicExpression() {
        //go to term
        this.term();
        //check if the current token is a logic operator, if so, match it and go to term
        if(this.tokens[this.index] === tokenType.EQUAL_LOGIC || this.tokens[this.index] === tokenType.NOT_EQUAL_LOGIC || this.tokens[this.index] === tokenType.GREATER_THAN_LOGIC || this.tokens[this.index] === tokenType.LESS_THAN_LOGIC || this.tokens[this.index] === tokenType.GREATER_THAN_EQUAL_LOGIC || this.tokens[this.index] === tokenType.LESS_THAN_EQUAL_LOGIC) {
            this.match(this.tokens[this.index]);
            this.term();
        }else{
            //if the current token is not a logic operator, throw an error
            throw new Error("Unexpected token in logicExpression: " + Object.keys(tokenType)[this.tokens[this.index]] + " at index: " + this.index);
        }
    }

    expression() {
        //go to term
        this.term();
        //check if the current token is an operator, if so, match it and go to term
        while(this.tokens[this.index] === tokenType.ADD_OP || this.tokens[this.index] === tokenType.SUBTRACT_OP || this.tokens[this.index] === tokenType.MULTIPLY_OP || this.tokens[this.index] === tokenType.DIVIDE_OP || this.tokens[this.index] === tokenType.MOD_OP) {
            this.match(this.tokens[this.index]);
            this.term();
        }
    }

    term() {
        //check if the current token is an identifier, literal, or open paren, if so, match it
        if(this.tokens[this.index] === tokenType.IDENT) {
            this.match(tokenType.IDENT);
        } else if(this.tokens[this.index] === tokenType.LITERAL) {
            this.match(tokenType.LITERAL);
        } else if(this.tokens[this.index] === tokenType.OPEN_PAREN) {
            this.match(tokenType.OPEN_PAREN);
            //go to expression
            this.expression();
            //match close paren
            this.match(tokenType.CLOSE_PAREN);
        } else {
            //if the current token is not an identifier, literal, or open paren, throw an error
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