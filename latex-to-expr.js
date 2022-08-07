

function Token(type, value) {   this.type = type;   this.value = value; }

const isDigit = (c) => c.length === 1 && c >= '0' && c <= '9';
const whitespaceRe = /\s/
function isWhitespace(c) {
  return whitespaceRe.test(c)
}
const alphaRe = /[a-zA-Z]/
function isAlpha(c) {
  return alphaRe.test(c)
}

class Tokenizer  {
  constructor(text) {
    this.text = text
    this.position = 0
    this.error = null
  }

  next() {
    if( this.position >= this.text.length ) {
      this.position += 1
      return '\0'
    }

    let c = this.text[this.position]
    this.position += 1
    return c    
  }

  nexttoken() {
    if( this.error != null ){
      return new Token('Error', this.error)
    }

    let c = this.next()
    while( isWhitespace(c) ) {
      c = this.next()
    }
 
    let num = ""
    while( isDigit(c) ){
      num += c
      c = this.next()
    }
    if( c == '.') {
      num += c
      c = this.next()
    }
    while( isDigit(c) ) {
      num += c
      c = this.next()      
    }

    if( num.length >0 ) {
      this.position -= 1
      if( num != '.' ) {
        return new Token("Number", num)
      }
      this.position -= 1
      c = '.'
    }

    if( c== '_') {
      return new Token("Subscript", null)
    }


    if( ['+', '-', '*', '/', '^'].includes(c) ) {      
      return new Token( 'Operator', c )
    }

    if( c == '{') {
      return new Token( 'BeginGroup', null);
    }
    if( c == '}') {
      return new Token( 'EndGroup', null);
    }

    if( [ '(', '[' ].includes(c) ){
      return new Token('OpenBrace',c)
    }

    if( [ ')', ']' ].includes(c) ){
      return new Token('CloseBrace',c)
    }

    let name = ""
    if( c == '\\'){
      c = this.next()
      if(c == ' ') {
        return new Token('Command',' ')
      }

      if(c == '}') {
        return new Token('Command','}')
      }
      if(c == '{') {
        return new Token('Command','{')
      }      
      if(c == '%') {
        return new Token('Other','%')
      }
      if(c == '&') {
        return new Token('Other','&')
      }



      while( isAlpha(c) ) {
        name += c
        c = this.next()
      }
      this.position -= 1

      if( name.length == 0) {
        this.error = "empty command name"
        return new Token('Error', null)
      } else {
        return new Token('Command', name)
      }
    }

    if( isAlpha(c) ) {
      return new Token('Variable',c)
    }

    if( c == '\0') {
      return new Token('EndOfStream',null)
    }

    return new Token('Other',c)

  }

}

class Node {
  constructor(value,lhs,rhs) {
    this.value = value;
    this.lhs = lhs;
    this.rhs = rhs
  }

  toString() {
    let value = this.value + "[" + this.lhs
    if( this.rhs != null) {
      value += ","
      value += this.rhs
    }
    value += "]"
    return value
  }

  toMathJS() {
    if( ['+','-','*','/','^'].includes(this.value) ){
      if( this.lhs.value =='null' || this.rhs.value =='null') {
        throw Error("You need something on both sides of '"+this.value+"'")
      }
      return "(" + this.lhs.toMathJS() + ")" + this.value + "(" + this.rhs.toMathJS() + ")"
    }
    if( this.value == 'number' ) {
      return this.lhs.toString()
    }    
    if( this.value == 'variable' ) {
      return this.lhs
    }
    if( this.value == 'neg' ) {
      if(this.lhs.value == 'null') {
        throw Error("You need to provide an argument to '-'")
      }
      let val =  "-1*(" + this.lhs.toMathJS() + ")"
      return val
    }

    if( this.value == 'pos' ) {
      if(this.lhs.value == 'null') {
        throw Error("You need to provide an argument to '+'")
      }
      return this.lhs.toMathJS()
    }


    // Otherwise, it's a named function or an inverse of it

    let func_node = this
    let inv_needed = false
    if(this.value == 'funcinv') {
      func_node = this.lhs
    }

    let func_name = func_node.value
    if( func_name in cannonical_functions) {
      func_name = cannonical_functions[func_name]
    }

    if( inv_needed ) {
      if( ['sin', 'cos', 'tan', 'cot', 'sec', 'csc'].includes(func_name) ) {
        func_name = 'arc' + func_name
      } else if(['arcsin', 'arccos', 'arctan', 'arccot', 'arcsec', 'arccsc']) {
        func_name = func_name.substring(3)
      } else if( func_name == 'exp') {
        func_name = 'ln'
      } else if( func_name == 'ln') {
        func_name = 'exp'
      } else if( func_name == 'log') {
        func_name = 'pow'
      } else {
        throw Error("Inverse function for " + func_name +" not known.")
      }
    }


    // Sqrt and log and pow are two argument functions potentially
    if( func_name == 'sqrt' ) {
      if(func_node.rhs != null) {        
        if( func_node.rhs.value == 'null') {
          throw Error("Radical cannot be empty")
        }
        if( func_node.lhs.value == 'null') {
          throw Error("Radical index cannot be empty")
        }

        return 'nthRoot(' + func_node.rhs.toMathJS() + "," + func_node.lhs.toMathJS() + ")"
      } else {
        if( func_node.lhs.value == 'null') {
          throw Error("Radical cannot be empty")
        }
        return 'sqrt('+ func_node.lhs.toMathJS() + ")"
      }
    }

    if( func_name == 'log' ) {
      if(func_node.rhs != null) {
        if( func_node.lhs.value == 'null') {
          throw Error("You need to fill in the missing base to 'log'")
        }
        if( func_node.rhs.value == 'null') {
          throw Error("You need to give an argument to 'log'")
        }
        return 'log(' + func_node.rhs.toMathJS() + "," + func_node.lhs.toMathJS() + ")"
      } else {
        if( func_node.lhs.value == 'null') {
          throw Error("You need to give an argument to 'log'")
        }
        return 'log10('+ func_node.lhs.toMathJS() + ")"
      }
    }

    if( func_name == 'ln' ){
      func_name = 'log'
    }

    if( func_name == 'pow' ) {
        return 'pow('+ func_node.lhs.toMathJS() + ","+ func_node.lhs.toMathJS() + ")"
    }

    if( func_node.lhs.value == 'null' ) {
      throw Error("You need to provide an argument to '"+func_name+"'")
    }

    return func_name + "(" + func_node.lhs.toMathJS() + ")";

  }

}


const greek_letters = { 
  'alpha': 'α', 
  'theta': 'θ', 
  'pi': 'π' 
}


class TokenFilter {

  constructor(tokenizer) {
    this.tokenizer = tokenizer
  }

  nexttoken() {
    let t = this.tokenizer.nexttoken()
    if( t.type == 'Command' ) {

      if( ['left', 'right', ' '].includes(t.value) ) {
        return this.nexttoken()   
      }

      if( t.value in greek_letters ) {
        return new Token('Variable', greek_letters[t.value])
      }

      if( t.value == 'cdot' ) {
        return new Token('Operator','*')        
      }
 
      if( t.value == 'backslash' ) {
        return new Token('Other','\\')
      }

      if( t.value == 'ge' ) {
        return new Token('Other','≥')
      }

      if( t.value == 'le' ) {
        return new Token('Other','≤')
      }

      if( t.value == 'operatorname' ) {
        if( this.tokenizer.nexttoken().type != 'BeginGroup' ) {
          throw Error("Malformed operator name")
        }
        let opname = ""
        t = this.tokenizer.nexttoken()
        while( t.type == 'Variable' ) {
          opname = opname + t.value
          t = this.tokenizer.nexttoken()
        }
        if( t.type != 'EndGroup' ) {
          throw Error("Malformed operator name")
        }
        return new Token('Command',opname)
      }
    }

    return t
  }
}

class UnexpectedFunctionCallError extends Error {
  constructor(message) {
    super(message); // (1)
    this.name = "UnexpectedFunctionCallError"; // (2)
  }
}


known_functions = [
'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
'arcsin', 'arccos', 'arctan', 'arccot', 'arcsec', 'arccsc', 
'asin', 'acos', 'atan', 'acot', 'asec', 'acsc', 
'exp', 'sqrt', 'log', 'ln', 'frac' ]

cannonical_functions = {
  'asin': 'arcsin',
  'acos': 'arccos',
  'atan': 'arctan',
  'asec': 'arcsec',
  'acsc': 'arccsc',
  'acot': 'arccot',
}

class Parser {
  constructor(text) {
    this.t = new TokenFilter( new Tokenizer(text))
    this.token_cache = null
  }

  nexttoken() {
    if( this.token_cache == null ) {
      this.token_cache = this.t.nexttoken()
    }
    return this.token_cache
  }

  consume() {
    this.token_cache = null
  }

  parse() {
    let rv = this.expression()
    console.log("parsed to")
    console.log(rv.toMathJS())
    return rv
    // return this.expression()
  }

  expression() {
    return this.addition()
  }

  addition() {

    let lhs = this.multiplication();

    while(true) {
      let next = this.nexttoken()
      if( next.type == 'Operator') {
        let op = next.value
        if( (op == '+') || (op == '-') ) {
          this.consume()
          let rhs = this.multiplication()
          lhs =  new Node(op,lhs,rhs)
        } else {
          throw Error("foo")
        }
      } else {
        break
      }
    }

    return lhs
  }

  multiplication() {
    let lhs = this.unary();

    while(true) {
      let next = this.nexttoken()

      if( next.type == 'Operator' ) {
        let op = next.value
        if( (op == '*') ||  (op == '/') ) {
          this.consume()
          let rhs = this.unary()
          lhs =  new Node(op,lhs,rhs)          
        } else {
          break
        }
      } else if( next.type == 'Command' || next.type == 'OpenBrace' ||
            next.type == 'Variable' || next.type == 'Number' ) {
          let rhs = this.power()
          lhs = new Node('*',lhs,rhs)                    
      } else {
        if( next.type == 'Other' ) {
          throw Error("I don't understand " + next.value)
        }
        break
      }
    }
    return lhs
  }

  // Works like multiplication except a leading unary +/- is not
  // permitted, and function calls are not allowable as factors. 
  // This is used for arguments to functions that are not surrounded by
  // parentheses.
  pmultiplication() {
    let lhs = this.power({allow_functions: false });

    while(true) {
      let next = this.nexttoken()

      if( next.type == 'Operator' ) {
        let op = next.value
        if( (op == '*') ||  (op == '/') ) {
          this.consume()
          let rhs = this.unary({allow_functions: false })
          lhs =  new Node(op,lhs,rhs)          
        } else {
          break
        }
      } else if( next.type == 'Command' || next.type == 'OpenBrace' ||
            next.type == 'Variable' || next.type == 'Number' ) {
          let rhs = this.power({allow_functions: false })
          lhs = new Node('*',lhs,rhs)                    
      } else {
        break
      }
    }
    return lhs
  }

  unary({allow_functions = true } = {} ) {    
    let t = this.nexttoken()
    if( t.type == 'Operator' ) {
      let op = t.value
      if( (op == '+') || (op == '-') ) {
        this.consume()        
        if(op == '-') {
          let lhs = this.unary()
          return new Node('neg',lhs,null)
        } else {
          let lhs = this.unary()
          return new Node('pos',lhs,null)
        }
      } else {
        return new Node("null",null,null)
      }
    } else {
      return this.power({allow_functions: allow_functions})
    }
  }

  power( {allow_functions = true } = {} ) {

    let lhs = this.funcapply({allow_functions: allow_functions})

    let next = this.nexttoken()
    if( next.type == 'Operator' ) {
      let op = next.value
      if (op == '^')  {
        this.consume()
        let rhs = this.unary()
        return new Node('^',lhs,rhs)
      }

    }

    return lhs
  }

  funcapply({allow_functions = true} = {}) {
    let t = this.nexttoken()

    if( t.type != 'Command' ) {
      return this.subscript()
    }

    if( t.value == 'frac' ) {
      this.consume()
      return this.frac()
    }

    if(!allow_functions) {
      throw new UnexpectedFunctionCallError("Unexpected function call: " + t.value)
    }

    if( !known_functions.includes(t.value) ) {
      throw Error("Unknown function: " + t.value)
    }

    this.consume()
    let fname = t.value
    let sup = null
    let sub = null

    t = this.nexttoken()
    if( (t.type == 'OpenBrace') &&  (t.value == '[') ){
      this.consume()
      sub = this.expression()
      t = this.nexttoken()
      if( !(t.type == 'CloseBrace' && t.value == ']') ) {
        throw Error("Malformed function modfier")
      }
      this.consume();        
    }

    t = this.nexttoken()
    if( t.type == 'Operator' && t.value == '^') {
      this.consume()
      try {
        sup = this.funcsup()        
      } catch {
        throw Error("Power on '" +fname +"' must be -1 or a positive number.")
      }
    }

    if( sub == null ) {
      t = this.nexttoken()
      if( t.type == 'Subscript' ) {
        this.consume()
        if( fname != 'log' ) {
          throw Error("Only 'log' can have a subscript.")
        }        
        sub = this.funcsub()
      }
    }

    if( sup == null ) {
      t = this.nexttoken()
      if( t.type == 'Operator' && t.value == '^') {
        this.consume()
        try {
          sup = this.funcsup()        
        } catch {
          throw Error("Power on '" +fname +"' must be -1 or a positive number.")
        }
      }
    }

    t = this.nexttoken()
    let arg = null
    if( t.type == 'OpenBrace' ) {
      this.consume()
      arg = this.expression();
      t = this.nexttoken();
      if( t.type != 'CloseBrace' ) {
        throw Error("Missing function closing brace")
      } 
      this.consume()
    } else if( t.type == 'BeginGroup' ) {
      this.consume()
      arg = this.expression();
      t = this.nexttoken();
      if( t.type != 'EndGroup' ) {
        throw Error("Missing function closing brace")
      }
      this.consume()
    } else {
      try {
        arg = this.pmultiplication()
      } catch(err) {
        if( err instanceof UnexpectedFunctionCallError) {
          throw Error("Parentheses needed for '" + fname + "'")
        } else {
          throw err
        }
      }
    }

    let base = new Node(fname,arg,null)
    if( sub != null) {
      base.rhs = base.lhs
      base.lhs = sub
    }
    if( sup == -1 ) {
      return new Node('funcinv',base,null)
    }

    if( sup != null ) {
      return new Node('^',base,sup)
    }

    return base;
  }

  frac() {
    let t = this.nexttoken()

    let needs_close = false
    let numer = null
    if( t.type == 'BeginGroup' ) {
      needs_close = true
      this.consume()
      numer = this.expression()
    } else {
      numer = this.unary()
    }
 
    if(needs_close) {
      t = this.nexttoken();
      if( t.type != 'EndGroup' ) {
        throw Error("Missing function closing brace")
      }
      this.consume()
    }

    needs_close = false
    let denom = null
    if( t.type == 'BeginGroup' ) {
      needs_close = true
      this.consume()
      denom = this.expression()
    } else {
      denom = this.unary()
    }
 
    if(needs_close) {
      t = this.nexttoken();
      if( t.type != 'EndGroup' ) {
        throw Error("Missing function closing brace")
      }
      this.consume()
    }

    return new Node('/',numer,denom)
  }


  funcsup() {
    let t = this.nexttoken()

    let needs_close = false
    if( t.type == 'BeginGroup' ) {
      this.consume()
      t = this.nexttoken()
      needs_close = true
    }

    let neg = false    
    if( t.type == 'Operator' && t.value == '-') {
      neg = true
      this.consume()        
    }

    t = this.nexttoken()
    let rv = null
    if( t.type == 'Number' ) {
      this.consume()
      if( neg ) {
        if( parseFloat(t.value) != 1 ) {
          throw Error("Power must be -1 or a positive number")
        }
        rv = -1
      } else {
        rv = new Node('number',parseFloat(t.value))
      }
    }

    if(needs_close) {
      t = this.nexttoken()
      if( t.type != 'EndGroup' ) {
        throw Error("Missing closing brace in superscript")
      }
      this.consume()
    }

    if( rv != null ){
      return rv
    }
    throw Error("Function power must be -1 or a positive number")
  }

  funcsub() {
    let t = this.nexttoken()
    let needs_close = false
    if( t.type == 'BeginGroup' ) {
      this.consume()

      let inner = this.expression();
      t = this.nexttoken()

      if( inner.value != 'number' ) {
        throw Error("Function subscript must be a positive number")
      }

      if( t.type == 'EndGroup' ) {          
        this.consume()
      } else {
        throw Error("Missing closing brace in subscript")
      }

      return inner      
    }
  }

  subscript() {
    let lhs = this.primary();
    let t = this.nexttoken()
    if( t.type == 'Subscript') {
      throw Error("Only function names can have subscripts")
    }
    return lhs
  }


  primary() {
    let t = this.nexttoken()

    if( t.type == 'OpenBrace' ) {
      this.consume()
      let brace = t.value

      t = this.nexttoken()
      if( t.type == 'CloseBrace' ) {
        throw Error("Parentheses cannot be empty")
      }

      let inner = this.expression()

      t = this.nexttoken()
      if( t.type != 'CloseBrace' ) {
        throw Error("Missing closing brace")
      }

      if( (t.value == ']' && brace == '(') || (t.value == '[' && brace == ')')) {
        throw Error("Mismatched braces: "+brace+" vs. "+t.value)
      }

      this.consume()
      return inner
    }

    if( t.type == 'BeginGroup' ) {
      this.consume()
      let inner = this.expression()

      t = this.nexttoken()
      if( t.type != 'EndGroup' ) {
        throw Error("Missing closing brace")
      }

      this.consume()
      return inner
    }

    if( t.type == 'Variable') {
      this.consume()
      return new Node('variable',t.value,null)
    }

    if( t.type == 'Number') {
      this.consume()
      return new Node('number',parseFloat(t.value),null)
    }

    if( t.type == 'EndGroup' || t.type =='CloseBrace' || t.type == 'EndOfStream') {
      return new Node('null',null,null)
    }

    if( t.type = 'Other' ) {
      if( t.value == '.' ) {
        throw Error("A '.' needs to be part of a number")
      }
      throw Error("I don't understand the '"+t.value+"' character");
    }

    throw Error("Unexpected token " + t.type + " " + t.value)
  }

}


try {
  module.exports = {
    Tokenizer: Tokenizer,
    Parser: Parser
  }  
} catch {
}
