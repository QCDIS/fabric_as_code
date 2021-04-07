import json
import sys

inpath = sys.argv[1]
outpath = sys.argv[2]

g = open(inpath, 'r')
with open(outpath, 'w') as fout:
  for l in g:
    fout.write(json.dumps(eval(l)))
