-- Migration 002: Add details to budgets table
-- Author: Antigravity
-- Date: 2026-02-03

ALTER TABLE budgets 
ADD COLUMN IF NOT EXISTS conditions text,
ADD COLUMN IF NOT EXISTS discount numeric(10, 2) DEFAULT 0;
