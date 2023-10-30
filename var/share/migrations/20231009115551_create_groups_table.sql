-- migrate:up
CREATE TABLE "auth"."group"
(
    "id"                 VARCHAR(255)  NOT NULL PRIMARY KEY,
    "name"               TEXT          NOT NULL,
    "description"        TEXT          NOT NULL,
    "created_by_user_id" BIGINT        NULL REFERENCES "auth"."user" ("id") ON DELETE CASCADE,
    "tags"               VARCHAR ARRAY NULL,
    "created_at"         TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"         TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE FUNCTION generate_group_search_vector(name TEXT, description TEXT, tags VARCHAR[])
    RETURNS TSVECTOR
    IMMUTABLE AS
$$
BEGIN
    RETURN TO_TSVECTOR('english', name || ' ' || description || ' ' || COALESCE(ARRAY_TO_STRING(tags, ' '), ''));
END;
$$ LANGUAGE plpgsql;

ALTER TABLE "auth"."group"
    ADD COLUMN "search_vector" TSVECTOR NULL GENERATED ALWAYS AS (
        "generate_group_search_vector"("name", "description", "tags")
        ) STORED;

CREATE INDEX "idx_group_search_vector"
    ON "auth"."group"
        USING gin ("search_vector");

CREATE TRIGGER "set_timestamp"
    BEFORE UPDATE
    ON "auth"."group"
    FOR EACH ROW
EXECUTE PROCEDURE "trigger_set_timestamp"();

CREATE TABLE "auth"."group_user"
(
    "group_id" VARCHAR(255) NOT NULL REFERENCES "auth"."group" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "user_id"  BIGINT       NOT NULL REFERENCES "auth"."user" ("id") ON DELETE CASCADE,
    PRIMARY KEY ("group_id", "user_id")
);

CREATE TABLE "auth"."group_group"
(
    "group_id"        VARCHAR(255) NOT NULL REFERENCES "auth"."group" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "member_group_id" VARCHAR(255) NOT NULL REFERENCES "auth"."group" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("group_id", "member_group_id")
);

INSERT INTO "auth"."group" ("id", "name", "description", "created_by_user_id", "tags")
VALUES ('all',
        'All users',
        'All users in the system. This group is automatically maintained and cannot be removed.',
        NULL,
        NULL);

CREATE FUNCTION "trigger_add_user_to_all_group"()
    RETURNS TRIGGER AS
$$
BEGIN
    INSERT INTO "auth"."group_user" ("group_id", "user_id")
    VALUES ('all', new."id");

    RETURN new;
END;
$$ LANGUAGE "plpgsql";

CREATE TRIGGER "add_user_to_all_group"
    AFTER INSERT
    ON "auth"."user"
    FOR EACH ROW
EXECUTE PROCEDURE "trigger_add_user_to_all_group"();

-- migrate:down
DROP TABLE "auth"."group";
DROP TABLE "auth"."group_user";
DROP TABLE "auth"."group_group";
DROP FUNCTION "trigger_add_user_to_all_group";
