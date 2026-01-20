-- Add position field to market_favorites table for drag & drop ordering
ALTER TABLE market_favorites 
ADD COLUMN position INT NOT NULL DEFAULT 0 AFTER is_dashboard_widget;

-- Update existing records to have sequential positions
SET @row_number = 0;
UPDATE market_favorites 
SET position = (@row_number:=@row_number + 1) 
ORDER BY created_at;
