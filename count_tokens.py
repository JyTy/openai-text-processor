import sys
from tiktoken import Tokenizer, TokenCount
from tiktoken.tokenizer import Tokenizer, RegexTokenizer

text = sys.stdin.read()
tokenizer = RegexTokenizer()

token_count = sum(1 for _ in tokenizer.tokenize(text))
print(token_count)
