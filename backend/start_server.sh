#!/bin/bash
source .env
python3 -m uvicorn main:app --reload --port 8001 --host 0.0.0.0
