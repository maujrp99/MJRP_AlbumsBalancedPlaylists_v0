"""F76 evidence: one line per screen and size from <label>/measures.json.  python3 reports/evidence/F76/summary.py <before|after>"""
import json
import os
import sys

here = os.path.dirname(os.path.abspath(__file__))
measures = json.load(open(os.path.join(here, sys.argv[1], 'measures.json')))
for key, v in measures.items():
    print(key, 'inner', v['innerWidth'], 'scrollW', v['scrollWidth'], 'scrollH', v['scrollHeight'],
          'text<12', v['textBelow12'], 'field<16', len(v['fieldsBelow16']),
          'target<44', v['targetsBelow44'], 'of', v['targets'])
