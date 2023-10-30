-- migrate:up
CREATE SCHEMA "oauth";
CREATE TABLE "oauth"."scope"
(
    "id"   VARCHAR(255) NOT NULL PRIMARY KEY,
    "name" VARCHAR      NOT NULL
);

CREATE TABLE "oauth"."client"
(
    "id"                 VARCHAR(255)  NOT NULL PRIMARY KEY,
    "name"               VARCHAR       NOT NULL,
    "redirect_uris"      VARCHAR ARRAY NULL,
    "secret"             VARCHAR       NULL,
    "user_id"            BIGINT        NULL REFERENCES "auth"."user" ("id") ON DELETE CASCADE,
    "skip_authorization" BOOLEAN       NOT NULL DEFAULT FALSE,
    "created_at"         TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"         TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER "set_timestamp"
    BEFORE UPDATE
    ON "oauth"."client"
    FOR EACH ROW
EXECUTE PROCEDURE "trigger_set_timestamp"();

CREATE TABLE "oauth"."client_scope"
(
    "client_id" VARCHAR(255) NOT NULL REFERENCES "oauth"."client" ("id") ON DELETE CASCADE,
    "scope_id"  VARCHAR(255) NOT NULL REFERENCES "oauth"."scope" ("id") ON DELETE CASCADE,
    PRIMARY KEY ("client_id", "scope_id")
);

CREATE TABLE "oauth"."access_token"
(
    "id"         SERIAL       NOT NULL PRIMARY KEY,
    "client_id"  VARCHAR(255) NOT NULL REFERENCES "oauth"."client" ("id") ON DELETE CASCADE,
    "user_id"    BIGINT       NULL REFERENCES "auth"."user" ("id") ON DELETE CASCADE,
    "expires_at" TIMESTAMPTZ  NOT NULL,
    "created_at" TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER "set_timestamp"
    BEFORE UPDATE
    ON "oauth"."access_token"
    FOR EACH ROW
EXECUTE PROCEDURE "trigger_set_timestamp"();

CREATE TABLE "oauth"."access_token_scope"
(
    "access_token_id" BIGINT       NOT NULL REFERENCES "oauth"."access_token" ("id") ON DELETE CASCADE,
    "scope_id"        VARCHAR(255) NOT NULL REFERENCES "oauth"."scope" ("id") ON DELETE CASCADE,
    PRIMARY KEY ("access_token_id", "scope_id")
);

CREATE TABLE "oauth"."refresh_token"
(
    "id"         SERIAL       NOT NULL PRIMARY KEY,
    "client_id"  VARCHAR(255) NOT NULL REFERENCES "oauth"."client" ("id") ON DELETE CASCADE,
    "user_id"    BIGINT       NULL REFERENCES "auth"."user" ("id") ON DELETE CASCADE,
    "expires_at" TIMESTAMPTZ  NOT NULL,
    "created_at" TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER "set_timestamp"
    BEFORE UPDATE
    ON "oauth"."refresh_token"
    FOR EACH ROW
EXECUTE PROCEDURE "trigger_set_timestamp"();

CREATE TABLE "oauth"."refresh_token_scope"
(
    "refresh_token_id" BIGINT       NOT NULL REFERENCES "oauth"."refresh_token" ("id") ON DELETE CASCADE,
    "scope_id"         VARCHAR(255) NOT NULL REFERENCES "oauth"."scope" ("id") ON DELETE CASCADE,
    PRIMARY KEY ("refresh_token_id", "scope_id")
);

CREATE TABLE "oauth"."authorization_code"
(
    "id"         SERIAL       NOT NULL PRIMARY KEY,
    "client_id"  VARCHAR(255) NOT NULL REFERENCES "oauth"."client" ("id") ON DELETE CASCADE,
    "user_id"    BIGINT       NOT NULL REFERENCES "auth"."user" ("id") ON DELETE CASCADE,
    "expires_at" TIMESTAMPTZ  NOT NULL,
    "created_at" TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER "set_timestamp"
    BEFORE UPDATE
    ON "oauth"."authorization_code"
    FOR EACH ROW
EXECUTE PROCEDURE "trigger_set_timestamp"();

CREATE TABLE "oauth"."authorization_code_scope"
(
    "authorization_code_id" BIGINT       NOT NULL REFERENCES "oauth"."authorization_code" ("id") ON DELETE CASCADE,
    "scope_id"              VARCHAR(255) NOT NULL REFERENCES "oauth"."scope" ("id") ON DELETE CASCADE,
    PRIMARY KEY ("authorization_code_id", "scope_id")
);

CREATE TABLE "oauth"."approval"
(
    "id"         SERIAL PRIMARY KEY,
    "user_id"    BIGINT       NOT NULL REFERENCES "auth"."user" ("id") ON DELETE CASCADE,
    "client_id"  VARCHAR(255) NOT NULL REFERENCES "oauth"."client" ("id") ON DELETE CASCADE,
    "expires_at" TIMESTAMPTZ  NOT NULL,
    "created_at" TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "oauth"."approval_scope"
(
    "approval_id" BIGINT  NOT NULL REFERENCES "oauth"."approval" ("id") ON DELETE CASCADE,
    "scope_id"    VARCHAR NOT NULL REFERENCES "oauth"."scope" ("id") ON DELETE CASCADE,
    PRIMARY KEY ("approval_id", "scope_id")
);

CREATE TRIGGER "set_timestamp"
    BEFORE UPDATE
    ON "oauth"."approval"
    FOR EACH ROW
EXECUTE PROCEDURE "trigger_set_timestamp"();

-- migrate:down
DROP SCHEMA "oauth" CASCADE;
