import json
import sys

inpath = sys.argv[1]
outpath = sys.argv[2]


# read file
with open(inpath, 'r') as myfile:
    data=myfile.read()
    
obj = json.loads(data)

print(json.dumps(obj))
