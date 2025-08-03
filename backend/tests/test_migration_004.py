"""
Test cases for migration 004_add_photos_age.sql
These tests verify the database state before and after migration.
Run these tests to ensure migration works correctly.
"""
import asyncio
import pytest
from supabase import create_client, Client
import os
import json
from typing import Optional

# Get Supabase credentials from environment
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

# Skip tests if credentials not available
pytestmark = pytest.mark.skipif(
    not SUPABASE_URL or not SUPABASE_ANON_KEY,
    reason="Supabase credentials not configured"
)

class TestMigration004:
    """Test migration 004 - Add photos and age requirements"""
    
    @classmethod
    def setup_class(cls):
        """Setup test client"""
        cls.supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    def test_photo_columns_exist(self):
        """Test 1: Verify photo columns were added to individuals table"""
        # Query table schema
        result = self.supabase.rpc('get_table_columns', {
            'table_name': 'individuals'
        }).execute()
        
        columns = {col['column_name'] for col in result.data}
        
        # These should exist after migration
        assert 'photo_url' in columns, "photo_url column missing"
        assert 'photo_history' in columns, "photo_history column missing"
        
        # Verify data types
        for col in result.data:
            if col['column_name'] == 'photo_url':
                assert col['data_type'] == 'text', "photo_url should be TEXT"
            elif col['column_name'] == 'photo_history':
                assert col['data_type'] == 'jsonb', "photo_history should be JSONB"
    
    def test_photo_consents_table_exists(self):
        """Test 2: Verify photo_consents table exists with all columns"""
        # Query table existence
        result = self.supabase.rpc('table_exists', {
            'table_name': 'photo_consents'
        }).execute()
        
        assert result.data is True, "photo_consents table should exist"
        
        # Check columns
        result = self.supabase.rpc('get_table_columns', {
            'table_name': 'photo_consents'
        }).execute()
        
        expected_columns = {
            'id', 'individual_id', 'photo_url', 
            'consented_by', 'consented_at', 'consent_location', 
            'created_at'
        }
        actual_columns = {col['column_name'] for col in result.data}
        
        assert expected_columns.issubset(actual_columns), \
            f"Missing columns: {expected_columns - actual_columns}"
    
    def test_approximate_age_category_exists(self):
        """Test 3: Verify approximate_age category was added"""
        result = self.supabase.table('categories').select("*").eq(
            'name', 'approximate_age'
        ).execute()
        
        assert len(result.data) == 1, "approximate_age category should exist"
        
        category = result.data[0]
        assert category['type'] == 'range', "approximate_age should be type 'range'"
        assert category['is_required'] is True, "approximate_age should be required"
        assert category['is_preset'] is True, "approximate_age should be preset"
        assert category['priority'] == 'high', "approximate_age should have high priority"
        assert category['danger_weight'] == 0, "approximate_age should not affect danger score"
        
        # Check options
        options = category.get('options', {})
        assert options.get('min') == 0, "Min age should be 0"
        assert options.get('max') == 120, "Max age should be 120"
        assert options.get('default') == 'Unknown', "Default should be 'Unknown'"
    
    def test_all_individuals_have_age_field(self):
        """Test 4: Verify all individuals have age field set to [-1, -1]"""
        result = self.supabase.table('individuals').select("id, data").execute()
        
        assert len(result.data) > 0, "Should have individuals in database"
        
        for individual in result.data:
            data = individual.get('data', {})
            age = data.get('approximate_age')
            
            assert age is not None, f"Individual {individual['id']} missing approximate_age"
            assert age == [-1, -1], f"Individual {individual['id']} age should be [-1, -1], got {age}"
    
    def test_indexes_exist(self):
        """Test 5: Verify indexes were created"""
        # Check for indexes using pg_indexes
        result = self.supabase.rpc('get_indexes', {
            'table_names': ['individuals', 'photo_consents']
        }).execute()
        
        index_names = {idx['indexname'] for idx in result.data}
        
        expected_indexes = {
            'idx_individuals_photo',
            'idx_consent_individual', 
            'idx_individuals_age'
        }
        
        missing_indexes = expected_indexes - index_names
        assert len(missing_indexes) == 0, f"Missing indexes: {missing_indexes}"


# Helper RPC functions that need to be created in Supabase
"""
-- Add these RPC functions to Supabase for testing:

CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS TABLE(column_name text, data_type text, is_nullable text)
LANGUAGE sql
AS $$
  SELECT 
    column_name::text,
    data_type::text,
    is_nullable::text
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = $1
  ORDER BY ordinal_position;
$$;

CREATE OR REPLACE FUNCTION table_exists(table_name text)
RETURNS boolean
LANGUAGE sql
AS $$
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = $1
  );
$$;

CREATE OR REPLACE FUNCTION get_indexes(table_names text[])
RETURNS TABLE(indexname text, tablename text)
LANGUAGE sql
AS $$
  SELECT indexname::text, tablename::text
  FROM pg_indexes 
  WHERE schemaname = 'public'
  AND tablename = ANY($1);
$$;
"""

if __name__ == "__main__":
    # Run tests directly
    pytest.main([__file__, "-v"])