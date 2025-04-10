const sequenceAutoIncrease = 
`
DO $$
DECLARE
    seq_record RECORD;
    max_val BIGINT;
BEGIN
    FOR seq_record IN
        SELECT 
            n.nspname AS schema_name,
            s.relname AS sequence_name,
            t.relname AS table_name,
            a.attname AS column_name
        FROM 
            pg_class s
        JOIN 
            pg_depend d ON d.objid = s.oid
        JOIN 
            pg_class t ON d.refobjid = t.oid
        JOIN 
            pg_namespace n ON n.oid = s.relnamespace
        JOIN 
            pg_attribute a ON a.attrelid = t.oid AND a.attnum = d.refobjsubid
        WHERE 
            s.relkind = 'S'
            AND d.deptype = 'a'
    LOOP
        EXECUTE format(
            'SELECT MAX(%I) FROM %I.%I',
            seq_record.column_name,
            seq_record.schema_name,
            seq_record.table_name
        )
        INTO max_val;

        IF max_val IS NULL THEN
            max_val := 0;
        END IF;

        EXECUTE format(
            'ALTER SEQUENCE %I.%I RESTART WITH %s',
            seq_record.schema_name,
            seq_record.sequence_name,
            max_val + 1
        );
    END LOOP;
END $$;
`

module.exports = {sequenceAutoIncrease}