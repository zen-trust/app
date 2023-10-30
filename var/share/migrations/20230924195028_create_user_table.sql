-- migrate:up
CREATE SCHEMA "auth";
CREATE TABLE "auth"."user"
(
    "id"                SERIAL PRIMARY KEY,
    "name"              VARCHAR(255)              NOT NULL,
    "email"             VARCHAR(255)              NOT NULL,
    "created_at"        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updated_at"        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "email_verified_at" TIMESTAMPTZ               NULL,
    "tags"              VARCHAR ARRAY             NULL
);

CREATE FUNCTION generate_user_search_vector(name TEXT, email TEXT, tags VARCHAR[])
    RETURNS TSVECTOR
    IMMUTABLE AS
$$
BEGIN
    RETURN TO_TSVECTOR('english', name || ' ' || REPLACE(email, '@', ' ') || ' ' || COALESCE(ARRAY_TO_STRING(tags, ' '), ''));
END;
$$ LANGUAGE plpgsql;

ALTER TABLE "auth"."user"
    ADD COLUMN "search_vector" TSVECTOR NULL GENERATED ALWAYS AS (
        "generate_user_search_vector"("name", "email", "tags")
        ) STORED;

CREATE INDEX "idx_user_search_vector"
    ON "auth"."user"
        USING gin ("search_vector");

CREATE TRIGGER "set_timestamp"
    BEFORE UPDATE
    ON "auth"."user"
    FOR EACH ROW
EXECUTE PROCEDURE "trigger_set_timestamp"();

-- migrate:down
DROP TABLE "auth"."user";
DROP SCHEMA "auth";
