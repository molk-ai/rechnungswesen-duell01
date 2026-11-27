#!/usr/bin/env python3
"""Create all curated question types: original subject questions plus games.
Run from anywhere: python tools/build_game_bank.py
"""
from pathlib import Path
import subprocess,sys
folder=Path(__file__).resolve().parent
for script in ['generate_bank.py','add_games.py','add_memory_bank.py','extend_assignment_bank.py']:
 print('Building:',script,flush=True)
 subprocess.run([sys.executable,str(folder/script)],check=True)
print('Finished: shared/questions.json, shared/questions.mjs, public/questions.js')
