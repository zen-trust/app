-- migrate:up
CREATE TABLE "auth"."invitation"
(
    "id"                 UUID        NOT NULL PRIMARY KEY,
    "email"              VARCHAR     NOT NULL,
    "token"              TEXT        NOT NULL,
    "created_by_user_id" BIGINT      NOT NULL REFERENCES "auth"."user" ("id") ON DELETE CASCADE,
    "used_by_user_id"    BIGINT      NULL REFERENCES "auth"."user" ("id") ON DELETE CASCADE,
    "created_at"         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at"         TIMESTAMPTZ NOT NULL,
    "used_at"            TIMESTAMPTZ NULL
);

CREATE TRIGGER "set_timestamp"
    BEFORE UPDATE
    ON "auth"."invitation"
    FOR EACH ROW
EXECUTE PROCEDURE "trigger_set_timestamp"();

CREATE TABLE "auth"."invitation_group"
(
    "invitation_id" UUID         NOT NULL REFERENCES "auth"."invitation" ("id") ON DELETE CASCADE,
    "group_id"      VARCHAR(255) NOT NULL REFERENCES "auth"."group" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("invitation_id", "group_id")
);

-- migrate:down
DROP TABLE "auth"."invitation";
