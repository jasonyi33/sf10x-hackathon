"""
CSV export endpoint for individuals data
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from typing import Dict, List, Any
import os
import csv
import io
from datetime import datetime
from supabase import create_client, Client
from api.auth import get_current_user


router = APIRouter()


@router.get("/api/export")
async def export_individuals_csv(user_id: str = Depends(get_current_user)):
    """
    Export all individuals to CSV format.
    
    Fields included:
    - name
    - height  
    - weight
    - skin_color
    - danger_score (uses danger_override if set, else danger_score)
    - last_seen (from most recent interaction)
    
    Returns CSV file download with all individuals (no filtering).
    """
    try:
        # Initialize Supabase client
        supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )
        
        # Get all individuals
        individuals_result = supabase.table("individuals").select("*").execute()
        individuals = individuals_result.data
        
        # Get all interactions to find last_seen dates
        interactions_result = supabase.table("interactions").select(
            "individual_id, created_at"
        ).order("created_at", desc=True).execute()
        interactions = interactions_result.data
        
        # Create a map of individual_id to last interaction date
        last_seen_map = {}
        for interaction in interactions:
            ind_id = interaction["individual_id"]
            if ind_id not in last_seen_map:
                last_seen_map[ind_id] = interaction["created_at"]
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.DictWriter(
            output,
            fieldnames=["name", "height", "weight", "skin_color", "danger_score", "last_seen"]
        )
        writer.writeheader()
        
        # Write each individual as a row
        for individual in individuals:
            # Extract basic data
            name = individual.get("name", "")
            data = individual.get("data", {})
            
            # Get field values, handle nulls as empty strings
            height = data.get("height", "")
            if height is None:
                height = ""
            
            weight = data.get("weight", "")
            if weight is None:
                weight = ""
                
            skin_color = data.get("skin_color", "")
            if skin_color is None:
                skin_color = ""
            
            # Determine danger score to display
            danger_override = individual.get("danger_override")
            if danger_override is not None:
                danger_score = danger_override
            else:
                danger_score = individual.get("danger_score", 0)
            
            # Get last seen date
            last_seen = last_seen_map.get(individual["id"], "")
            
            # Write row
            writer.writerow({
                "name": name,
                "height": str(height) if height != "" else "",
                "weight": str(weight) if weight != "" else "",
                "skin_color": skin_color,
                "danger_score": str(danger_score),
                "last_seen": last_seen
            })
        
        # Get CSV content
        csv_content = output.getvalue()
        output.close()
        
        # Return as file download
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": "attachment; filename=individuals_export.csv"
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to export data: {str(e)}"
        )