-- migrate:up
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
    RETURNS TRIGGER AS
$$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE FUNCTION websearch_to_wildcard_tsquery(text_query text)
RETURNS tsquery AS $$
    DECLARE
        "query_splits"   TEXT[];
        "split"          TEXT;
        "new_text_query" TEXT := '';
    BEGIN
        SELECT REGEXP_SPLIT_TO_ARRAY("d"::TEXT, '\s* \s*')
        INTO "query_splits"
        FROM "websearch_to_tsquery"('simple', "text_query") "d";
        FOREACH "split" IN ARRAY "query_splits"
            LOOP
                CASE
                    WHEN "split" = '|' OR "split" = '&' OR "split" = '!' OR "split" = '<->' OR "split" = '!('
                    THEN new_text_query := new_text_query || split || ' ';
                    ELSE new_text_query := new_text_query || split || ':* ';
                END CASE;
            END LOOP;
        RETURN TO_TSQUERY('simple', "new_text_query");
    END;
$$ LANGUAGE plpgsql;

-- migrate:down
DROP FUNCTION trigger_set_timestamp;
