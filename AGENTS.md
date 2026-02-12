## Secret-Safety Non-Negotiables

When a user asks about security, leaks, keys, tokens, passwords, or secret scrubbing:

1. Treat any key/token/password-like value as compromised unless clearly a placeholder.
2. Never output, echo, or quote secret values from `.env*`, key files, or command output.
3. Never keep concrete key-like defaults in tracked files. Use placeholders only.
4. Before final response, run both scans:
   - Tracked files scan for key/token/private-key signatures.
   - Git history scan for the same signatures.
5. If any real secret is found or was previously committed:
   - Instruct immediate rotation/revocation first.
   - Then scrub files and history.
6. Do not claim "clean" until scans pass and ignored-file protections are verified.
7. Ensure `.gitignore` blocks:
   - `.env*` except explicit example files.
   - Private key/cert patterns (`*.pem`, `*.key`, `*.p8`, etc.).
8. If a user provides a secret in chat, immediately instruct them to rotate it.
