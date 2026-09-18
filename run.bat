@echo off
echo Starting IBVAP Backend...
start cmd /k "cd backend && pip install -r requirements.txt && python run_demo.py"

echo Starting IBVAP Frontend...
start cmd /k "npm install && npm run dev"

echo IBVAP is running!
