CREATE TABLE account_access_tokens (
    token_hash bytea PRIMARY KEY CHECK (octet_length(token_hash) = 32),
    account_id uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL
);

CREATE INDEX account_access_tokens_account_idx ON account_access_tokens (account_id);
