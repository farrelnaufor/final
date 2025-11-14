
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'user_id'
    ) THEN
        -- Add the user_id column
        ALTER TABLE orders ADD COLUMN user_id UUID;
        
        -- Add foreign key constraint to link with profiles table
        ALTER TABLE orders 
            ADD CONSTRAINT fk_orders_user_id 
            FOREIGN KEY (user_id) 
            REFERENCES profiles(id) 
            ON DELETE SET NULL;
        
        -- Add index for better performance
        CREATE INDEX idx_orders_user_id ON orders(user_id);
        
        RAISE NOTICE 'Column user_id added to orders table';
    ELSE
        RAISE NOTICE 'Column user_id already exists in orders table';
    END IF;
END $$;