#!/usr/bin/env python3
# cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
catalog_marks_guard.py - the PreToolUse hook that refuses an AGENT's command that would produce the human's valve on
the canonical catalog (CC-ADR-0014 section 10, accepted by the MJRP on 2026-10-14 15:09; CC-ADR-0016 section 1) and on the acceptance of a
feature (CC-ADR-0024 section 4: the same mechanism serves a second valve, `Human-accepted:` / `Human-reopened:`) and on the
order of the features that did not start (CC-ADR-0029: `Human-prioritized:`, the same footer family).

Why: the Control Center screen hands over a ready-made command (apply the batch of `catalog-marks/<batch>/` and commit
it with `Catalog-editorial:` stamps). A commit with that stamp is the MJRP's valve (ADR-0019 section 2), and the
`commit-msg` hook only refuses it next to an agent's `Co-Authored-By:` - an agent that did not sign would pass. This is
the extra step, only in Claude Code. It is a step, not the guarantee: other platforms and the browser are covered by
the written rule in AGENTS.md.

It refuses (exit 2, one line on stderr that Claude Code hands back to the agent) when ONE of these holds:
  1. A simple command is `git apply`, `git am` or `git commit`, and the WHOLE command mentions `catalog-marks/` followed
     by a full batch id (`YYYYMMDD-HHMMSS-<8 hex>`) - the command of the screen puts the folder in a variable before
     the `git apply`, hence "the whole command". The same for `acceptances/` followed by a full batch id (CC-ADR-0024).
  2. A simple command is `git commit` and its message has a line that STARTS with `Catalog-editorial:`,
     `Human-accepted:`, `Human-reopened:` or `Human-prioritized:` (any case, the way git reads a footer key): in `-m`/`--message`, in a
     `--trailer` whose key is one of those, in the file of `-F`/`--file` (read from the cwd, up to 64 KB, if it exists)
     or in the body of a heredoc when it is `-F -`.
  (F166, CC-ADR-0039 section 7: `/audit-answers` is treated as `/acceptances` here: an answer to an audit question is the human's fact.
  F181, CC-ADR-0042 section 8: `/proposal-answers`, the answers to an agent's batch of proposals, the same.)
  3. A simple command is `curl`, `wget`, `http` or `https` (HTTPie), it sends a body or names a method other than GET
     (`-X`, `-d`, `--data*`, `--json`, `--request`, `--post-data`, or HTTPie's POST/DELETE word) and a URL of
     `127.0.0.1` or `localhost` whose path starts with `/acceptances`: that is the route that PREPARES the acceptance
     of the screen (CC-ADR-0024 section 4 item 1: an agent never calls it). A `GET`, a `grep` or a `cat` passes.
     Since the judge of 2026-10-20 the route is recognized in every spelling of this machine (127.x, localhost, [::1], 0.0.0.0, with or
     without the scheme, HTTPie's `:8765/...`), by curl -F/-T/--form too, and when an interpreter (node, deno, bun, python, ruby, perl,
     php) carries it in its script.
  4. A simple command runs a script file (`sh file`, `source file`, `bash -c "$(cat file)"`, `eval`, `cat file | sh`): the file is read and
     judged as the command itself; and a `git commit`, `commit-tree` or `merge` whose message is a file the SAME command writes, or whose
     trailer alias (`git -c trailer.x.key=Human-accepted`, `git config trailer.…`) is the stamp, is refused. A batch folder found by a
     glob (`acceptances/*/change.patch`) counts as the folder.
  5. (F52 judge P1-1) The valve of the test that calls the route that PREPARES a batch: a command that sets
     `CC_ALLOW_CATALOG_MARKS_PREP` - as `VAR=1 cmd`, after `env`/`export`, inside `sh -c` or a heredoc given to a shell, or
     INSIDE the program of an interpreter (`node -e "process.env.VAR='1'; execSync(...)"`, `python3 -c "os.environ['VAR']='1'"`,
     a heredoc fed to node/python): the variable is the MJRP's opt-in for `discard-focus.test.mjs`; an agent that sets it opts in
     for him. Reading it (`process.env.VAR === '1'`) passes.
  6. (F52 judge P1-1) A command that reaches the route itself: an http client (`curl`, `wget`, `http`, `xh`...) with
     `/catalog/marks` in its words; an interpreter (`python`, `node`, `deno`, `ruby`, `perl`...) whose INLINE program
     (`-c`, `-e`, `-p`, `--eval`) holds the route; or a heredoc that feeds an interpreter a program that holds the route
     next to a call of an http library. A script file that only receives the route as text (`python3 notes.py "POST
     /catalog/marks"`) is documentation, not a call, and passes. The route prepares a batch (`POST /catalog/marks`); an agent never calls it (AGENTS.md).
  Rules 5 and 6 answer with their own line (REFUSAL_ROUTE), whatever way the command comes: direct, `env`, `bash -c`,
  `eval`, a heredoc. Besides the guard, `discard-focus.test.mjs` skips by itself inside an agent session (`CLAUDECODE=1` and the other
  marks of an agent), whatever the variable says.

How it avoids false positives: only `Bash`; only commands that RUN `git apply|am|commit` (ls, cat, grep -r catalog-marks,
`git log --grep=Catalog-editorial` and `git diff` pass); the stamp counts only at the START of a message line (a
commit that cites it in the middle of a sentence passes); the folder counts only with the complete batch id.

How it reads the command: the text is split into simple commands by shlex at `;` `&&` `||` `|` `(` `)` and line breaks
(heredoc bodies are lifted out first); the argument of `sh -c`, `bash -c`, `zsh -c` and `eval` is split again,
recursively. A command shlex cannot read falls back to a crude two-signal text test (never to a free pass).

Any doubt of its own - unreadable input, an error in the hook - exits 0 with `catalog-marks-guard: não avaliou
(<reason>)` on stderr: a gate that blocks what it should not gets switched off (the lesson of stop_gate.py).

What it does NOT catch, by design (the list is in CC-ADR-0024 section 4.5, dated amendment of 2026-10-20: a URL built in a variable, `curl -K`,
a script in a language it does not read, `printf 'Human-%s' accepted`, GIT_EDITOR, `git am`, `-C <commit>`, another platform) (CC-ADR-0014 section 10): other platforms (Codex, Gemini, Cursor) and the browser; a
commit made by a script file or another interpreter (`python3 -c`); `git commit --amend` or `-C <commit>` of a commit
that already carries the stamp; `Conformance-waiver:` (a line in this script if the MJRP asks).
The deliberate evasions of rules 5 and 6 that remain, an honest limit of a text reader (the second line of defence is the test, which skips
in an agent session): the route written percent-encoded (`/catalog%2Fmarks`, `/catalog/%6Darks`); the route or the variable
name ASSEMBLED by a variable or a concatenation (`R=/catalog/mar; curl "${R}ks"`, `process.env['CC_ALLOW_'+'CATALOG_MARKS_PREP']`); the
variable arriving by file (`node --env-file=x`, `dotenv`); a script FILE that sets the variable or calls the route (the hook reads a file
only for the rules of the stamp); and an agent that unsets its own session marks before running the test.

Input: the hook JSON on stdin (tool_name, tool_input.command, cwd). Python 3 stdlib only.
"""
import json
import os
import re
import shlex
import sys
from pathlib import Path

sys.dont_write_bytecode = True                      # runs inside every project: leave no __pycache__

REFUSAL = ("catalog-marks-guard: o commit da marcação do catálogo é do MJRP — ele roda o comando da tela no terminal "
           "dele (CC-ADR-0014 § 3; AGENTS.md, válvulas do humano)")
REFUSAL_ROUTE = ("catalog-marks-guard: a rota que prepara a marcação do catálogo (POST /catalog/marks) e a variável que "
                 "libera o teste que a chama (CC_ALLOW_CATALOG_MARKS_PREP) são do MJRP — o agente nunca as usa "
                 "(AGENTS.md, válvulas do humano)")
VALVE_VAR = "CC_ALLOW_CATALOG_MARKS_PREP"
# the variable being SET inside a program: `process.env.VAR = 1`, `os.environ['VAR'] = 1`, `{VAR: 1}`, `putenv('VAR', 1)`, `VAR=1`; not `=== '1'`
VALVE_SET = re.compile(VALVE_VAR + r"[\"']?\]?\s*(?:=(?!=)|:|,)")
ROUTE = re.compile(r"/catalog/marks(?![\w-])")             # not `/catalog/marks-other`
ROUTE_CLIENTS = {"curl", "wget", "http", "https", "xh", "httpie", "hurl"}
INLINE_FLAG = re.compile(r"^(-[A-Za-z]*[cep][A-Za-z]*|--eval|--print)$")
HTTP_CALL = re.compile(r"urlopen|requests\.|httpx|fetch\(|http\.client|urllib|axios|XMLHttpRequest|http\.request|net/http|curl|wget")
ROUTE_INTERPRETERS = re.compile(r"^(python[0-9.]*|node|nodejs|deno|bun|ruby|perl|php|lua|osascript)$")
REFUSAL_ACCEPTANCE = ("catalog-marks-guard: o aceite de uma feature é do MJRP — ele roda o comando da tela no terminal dele "
                      "(CC-ADR-0024 § 4; AGENTS.md, válvulas do humano)")
ACCEPTANCE_SIGNAL = re.compile(r"acceptances|Human-(?:accepted|reopened|prioritized|passkey)", re.IGNORECASE)
# a full batch id, or a glob where the id goes (`acceptances/*/change.patch`: the batch found by pattern)
BATCH_DIR = re.compile(r"(?:catalog-marks|acceptances)/(?:\d{8}-\d{6}-[0-9a-f]{8}|[^\s/'\"]*[*?\[][^\s/'\"]*)")
STAMP_WORD = re.compile(r"Catalog-editorial|Human-accepted|Human-reopened|Human-prioritized|Human-passkey", re.IGNORECASE)
STAMP_ANYWHERE = re.compile(r"(?:Catalog-editorial|Human-accepted|Human-reopened|Human-prioritized|Human-passkey):", re.IGNORECASE)
TRAILER_ALIAS = re.compile(r"^trailer\.[^=]*\.key=\s*(?:Catalog-editorial|Human-accepted|Human-reopened|Human-prioritized|Human-passkey)\s*:?\s*$", re.IGNORECASE)
CAT_SUBST = re.compile(r"(?:\$\(|`)\s*cat\s+([^\s)`]+)")
STAMP_KEYS = ("catalog-editorial", "human-accepted", "human-reopened", "human-prioritized", "human-passkey")
STAMP_LINE = re.compile(r"^(Catalog-editorial|Human-accepted|Human-reopened|Human-prioritized|Human-passkey):", re.IGNORECASE | re.MULTILINE)
# CC-ADR-0038: the commands that would change what a remote approval is checked against, or open the machine further
REFUSAL_PASSKEY = ("catalog-marks-guard: a aprovação de longe é do MJRP: `tailscale serve` e `funnel`, `git replace`, mexer na main por "
                   "`update-ref` ou `branch -f` e gravar o destino do push (`cc push-target`) o agente não roda (CC-ADR-0038, CC-ADR-0044; AGENTS.md, válvulas do humano)")
REPLACE_READS = {"-l", "--list"}
SEEN = []                                                  # the stamp keys the judge met, to pick the sentence of the refusal
# this machine, however it is spelled (127.0.0.1, 127.1, localhost, [::1], 0.0.0.0), with or without the scheme, or HTTPie's `:8765/...`
LOOPBACK = r"(?:127(?:\.\d{1,3}){1,3}|localhost|0\.0\.0\.0|\[::1\]|::1|\d{8,10}|0x[0-9a-f]{8})"   # 2130706433 and 0x7f000001 are 127.0.0.1 too
ACCEPTANCE_URL = re.compile(r"(?<![\w.\-~/])(?:(?:https?:)?//)?(?:(?:" + LOOPBACK + r"|[\w.-]+\.ts\.net)(?::[\w{}$%]+)?|:\d{2,5})(?:/\.{1,2}|/[\w.\-~%]+/\.\.)*/(?:acceptances|audit-answers|proposal-answers|approvals|passkeys|remote)(?![\w-])",
                            re.IGNORECASE)
HTTP_CLIENTS = {"curl", "wget", "aria2c"}
HTTPIE = {"http", "https", "xh", "xhs", "httpie"}                    # a body is a POST unless the method says otherwise
INTERPRETERS = {"node", "nodejs", "deno", "bun", "python", "python3", "ruby", "perl", "php"}
WRITE_FLAG = re.compile(r"^(?:-X|--request|--method|-d|-F|-T|--data(?:-[a-z]+)?|--form(?:-string)?|--upload-file|--json|--post-data|"
                        r"--post-file)(?:=|$)|^-[A-Za-z]*[XdFT]")
HTTPIE_READ = {"GET", "HEAD", "OPTIONS"}
COMMITS = ("commit", "commit-tree", "merge")                         # the subcommands that take a message with -m / -F
HEREDOC = re.compile(r"<<(-?)[ \t]*([\"']?)([A-Za-z0-9_]+)\2")
ASSIGN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*=")
REDIRECT = re.compile(r"^[<>]+[&|]?$")
SHELLS = {"sh", "bash", "zsh", "dash", "ksh"}
# A closed list: a wrapper not named here hides the command, the limit of a text reader (the written rule is the second line of defence).
WRAPPERS = {"env", "command", "exec", "nohup", "sudo", "time", "nice", "timeout", "gtimeout", "caffeinate", "stdbuf", "ionice", "setsid", "taskpolicy",
            "arch", "xargs"}
# the options of a wrapper that take the next word, and the wrappers with a positional before the command
WRAPPER_VALUES = {"env": {"-u"}, "nice": {"-n", "--adjustment"}, "timeout": {"-k", "-s", "--kill-after", "--signal"}, "gtimeout": {"-k", "-s", "--kill-after", "--signal"},
                  "taskpolicy": {"-c", "-d", "-g", "-t", "-l", "-p"}, "arch": {"-e", "-d"}, "xargs": {"-I", "-J", "-L", "-n", "-P", "-R", "-S", "-s", "-E"}, "caffeinate": {"-t", "-w"},
                  "stdbuf": {"-i", "-o", "-e"}, "ionice": {"-c", "-n", "-p"}, "sudo": {"-u", "-g", "-h", "-p"}}
WRAPPER_POSITIONAL = {"timeout", "gtimeout"}
SHELL_WORDS = {"{", "}", "!", "then", "do", "else", "if", "while", "until", "elif", "fi", "done"}
LONG_WITH_ARG = {"--author", "--date", "--cleanup", "--reuse-message", "--reedit-message", "--fixup", "--squash",
                 "--template", "--pathspec-from-file"}
GIT_OPT_WITH_ARG = {"-c", "--git-dir", "--work-tree", "--namespace", "--super-prefix", "--config-env"}
MAX_DEPTH = 5
MAX_FILE = 64 * 1024


def lift_heredocs(text):
    """(flat text, [heredoc bodies]): unquoted newlines become `;` and the bodies of heredocs leave the text, so
    that a message body is never read as commands. Quote-aware, so `echo '<<X'` does not swallow what follows."""
    out, bodies, pending = [], [], []
    i, n, quote = 0, len(text), None
    while i < n:
        c = text[i]
        if quote == "'":
            out.append(c)
            quote = None if c == "'" else quote
            i += 1
            continue
        if quote == '"':
            if c == "\\" and i + 1 < n:
                out.append(text[i:i + 2])
                i += 2
                continue
            out.append(c)
            quote = None if c == '"' else quote
            i += 1
            continue
        if c == "\\" and i + 1 < n:
            if text[i + 1] != "\n":
                out.append(text[i:i + 2])
            i += 2
            continue
        if c in "'\"":
            quote = c
            out.append(c)
            i += 1
            continue
        if c == "`":
            out.append(" ; ")
            i += 1
            continue
        if c == "#" and (i == 0 or text[i - 1] in " \t\n;&|()"):
            while i < n and text[i] != "\n":
                i += 1
            continue
        if text.startswith("<<", i) and not text.startswith("<<<", i):
            m = HEREDOC.match(text, i)
            if m:
                pending.append((m.group(3), m.group(1) == "-"))
                out.append(m.group(0))
                i = m.end()
                continue
        if c == "\n":
            out.append(" ; ")
            i += 1
            for delim, strip in pending:
                body = []
                while i < n:
                    j = text.find("\n", i)
                    line, i = (text[i:j], j + 1) if j != -1 else (text[i:], n)
                    line = line.lstrip("\t") if strip else line
                    if line == delim:
                        break
                    body.append(line)
                bodies.append("\n".join(body))
            pending = []
            continue
        out.append(c)
        i += 1
    return "".join(out), bodies


def is_separator(tok):
    """A token made only of shell punctuation that ends a simple command (`;` `&&` `||` `|` `(` `)` ...), not a redirect."""
    return (all(ch in ";|&()<>" for ch in tok) and any(ch in ";|&()" for ch in tok) and not REDIRECT.match(tok))


def simple_commands(flat):
    """The simple commands of a flat text as lists of words. Raises ValueError when shlex cannot read it."""
    lex = shlex.shlex(flat, posix=True, punctuation_chars=True)
    lex.whitespace_split = True
    lex.commenters = ""
    cmds, cur = [], []
    for tok in lex:
        if is_separator(tok):
            if cur:
                cmds.append(cur)
            cur = []
        else:
            cur.append(tok)
    if cur:
        cmds.append(cur)
    return cmds


def strip_prefix(argv):
    """Drops what comes before the real command: shell words, `VAR=value`, `env`/`command` (and their options)."""
    a = list(argv)
    while a:
        t = a[0]
        if t in SHELL_WORDS or ASSIGN.match(t):
            a.pop(0)
        elif os.path.basename(t) in WRAPPERS:
            wrapper = os.path.basename(a.pop(0))
            while a and (a[0].startswith("-") or ASSIGN.match(a[0])):
                if a[0] in WRAPPER_VALUES.get(wrapper, ()) and len(a) > 1:
                    a.pop(0)
                a.pop(0)
            if wrapper in WRAPPER_POSITIONAL and a:
                a.pop(0)
        else:
            break
    return a


def git_parts(argv):
    """(subcommand, its arguments, the -C directory or None, the `-c key=value` settings) when argv is a git command, else None."""
    if not argv or os.path.basename(argv[0]) != "git":
        return None
    i, cdir, configs = 1, None, []
    while i < len(argv):
        t = argv[i]
        if t == "-C" and i + 1 < len(argv):
            cdir = argv[i + 1]
            i += 2
        elif t == "-c" and i + 1 < len(argv):
            configs.append(argv[i + 1])
            i += 2
        elif t.startswith("--config-env=") or (t == "--config-env" and i + 1 < len(argv)):
            i += 1 if "=" in t else 2
        elif t in GIT_OPT_WITH_ARG and i + 1 < len(argv):
            i += 2
        elif t.startswith("-"):
            i += 1
        else:
            break
    if i >= len(argv):
        return None
    return argv[i], argv[i + 1:], cdir, configs


def has_stamp(text):
    """A message line that starts with the stamp. A literal backslash-n counts as a line break: `$'a\\nCatalog-...'`
    reaches shlex with the backslash-n still in it."""
    found = STAMP_LINE.search(text.replace("\\n", "\n"))
    if found:
        SEEN.append(found.group(1).lower())
    return bool(found)


def read_message_file(name, cwd):
    p = Path(name)
    p = p if p.is_absolute() else Path(cwd) / p
    try:
        if not p.is_file():
            return None
        with open(p, "rb") as fh:
            return fh.read(MAX_FILE).decode("utf-8", errors="replace")
    except OSError:
        return None


def commit_carries_stamp(rest, cwd, heredocs, other_words, whole=""):
    """True when the message of this `git commit` has a line starting with one of the human's stamps."""
    texts, stdin_message = [], False

    def from_file(name):
        nonlocal stdin_message
        if name == "-":
            stdin_message = True
        else:
            body = read_message_file(name, cwd)
            if body is not None:
                texts.append(body)
            elif STAMP_ANYWHERE.search(whole.replace("\\n", "\n")):    # a file this very command writes: it is not there yet
                SEEN.append(STAMP_ANYWHERE.search(whole).group(0)[:-1].lower())
                texts.append("Human-accepted: made in the same command")

    i = 0
    while i < len(rest):
        t = rest[i]
        if t == "--":
            break
        if t.startswith("--"):
            name, eq, val = t.partition("=")
            if name in ("--message", "--trailer", "--file") or name in LONG_WITH_ARG:
                if not eq:
                    val = rest[i + 1] if i + 1 < len(rest) else ""
                    i += 1
                if name == "--message":
                    texts.append(val)
                elif name == "--trailer":
                    key = re.split(r"[:=]", val, maxsplit=1)[0].strip().lower()
                    if key in STAMP_KEYS:
                        SEEN.append(key)
                        return True
                elif name == "--file":
                    from_file(val)
        elif t.startswith("-") and len(t) > 1:
            for j in range(1, len(t)):
                if t[j] in "mFCct":                               # short options that take a value
                    val = t[j + 1:]
                    if not val and i + 1 < len(rest):
                        val = rest[i + 1]
                        i += 1
                    if t[j] == "m":
                        texts.append(val)
                    elif t[j] == "F":
                        from_file(val)
                    break
        i += 1
    if stdin_message:
        texts += heredocs + other_words                           # `printf '...' | git commit -F -` too
    return any(has_stamp(x) for x in texts)


GATE_RECORD = "push-gate-passed.json"
GATE_READERS = {"cat", "head", "tail", "less", "more", "grep", "egrep", "ls", "stat", "wc", "file", "jq", "test", "[", "diff", "cmp"}


def writes_gate_record(argv):
    """True when a simple command may WRITE the file where a project's gate records the SHA it approved (F244, CC-ADR-0045 § 8):
    anything that names it but a plain reader, and a reader whose output is redirected into it. Reading it stays free: the agent
    needs it to know why a card is stuck."""
    hits = [i for i, w in enumerate(argv) if GATE_RECORD in w]
    if not hits:
        return False
    if os.path.basename(argv[0]) not in GATE_READERS:
        return True
    return any(re.match(r"^\d*>", argv[i]) or (i > 0 and re.match(r"^\d*>>?\|?$", argv[i - 1])) for i in hits)


def touches_passkey_trust(argv):
    """`tailscale serve|funnel`, `git replace` (its list is a read), `git update-ref` or `git branch -f` over main (CC-ADR-0038). A script file that does the same
    passes: the limit that ADR names."""
    if os.path.basename(argv[0]).lower() == "tailscale":              # the app's binary is `Tailscale`
        rest = [w for w in argv[1:] if w in ("serve", "funnel")]
        if not rest:
            return False
        after = argv[argv.index(rest[0]) + 1:]
        return not (after and after[0] == "status")                   # the status is a read, only right after the subcommand
    if "push-target" in argv[1:] or any(w.endswith("push-targets.json") for w in argv[1:]):  # F234, CC-ADR-0044: where his push goes
        return True
    if writes_gate_record(argv):                                    # F244, CC-ADR-0045 § 8: the SHA the project's gate approved
        return True
    parts = git_parts(argv)
    if parts is None:
        return False
    sub, rest = parts[0], parts[1]
    if sub == "replace":
        return not (REPLACE_READS & set(rest))
    if sub == "update-ref":                                          # HEAD and --stdin may be main: what cannot be told is refused
        return any(w in ("main", "refs/heads/main", "HEAD", "--stdin") for w in rest)
    if sub == "branch":
        forced = any(w == "--force" or re.match(r"^-[A-Za-z]*[fM]", w) for w in rest)
        return forced and any(w in ("main", "refs/heads/main") for w in rest)
    return False


def calls_acceptance_route(argv):
    """True when argv is a client that WRITES (a method other than GET, or a body) to `/acceptances` on this machine, or an
    interpreter whose script names that route (`node -e fetch(...)`, `python3 -c urlopen(...)`: no GET exists there, so any mention)."""
    client = os.path.basename(argv[0])
    words = argv[1:]
    if not any(ACCEPTANCE_URL.search(w) for w in words):
        return False
    if client in INTERPRETERS:
        return True
    if client in HTTPIE:                                              # HTTPie / xh: a body (or stdin) makes it a POST
        methods = [w.upper() for w in words if w.upper() in HTTPIE_READ | {"POST", "PUT", "PATCH", "DELETE"}]
        return not methods or methods[0] not in HTTPIE_READ
    if client in HTTP_CLIENTS:
        return any(WRITE_FLAG.match(w) for w in words if w.startswith("-"))
    return False


def is_client_or_interpreter(argv):
    """An http client or an interpreter among the words of a command (`curl ...`, `uv run python -c ...`, `npx node ...`)."""
    names = {os.path.basename(w) for w in argv}
    return bool(names & ROUTE_CLIENTS) or any(ROUTE_INTERPRETERS.match(n) for n in names)


def inline_programs(argv):
    """The inline programs of an interpreter among the words (`node -e PROGRAM`, `python3 -c PROGRAM`, `deno eval PROGRAM`)."""
    programs = []
    for i, w in enumerate(argv):
        if ROUTE_INTERPRETERS.match(os.path.basename(w)):
            rest = argv[i + 1:]
            programs += [rest[j + 1] for j in range(len(rest) - 1) if INLINE_FLAG.match(rest[j])]
    return programs


def reaches_route(argv):
    """A client, or an interpreter with an inline program, aimed at the route that prepares a batch."""
    if not any(ROUTE.search(w) for w in argv):
        return False
    return bool({os.path.basename(w) for w in argv} & ROUTE_CLIENTS) or any(ROUTE.search(p) for p in inline_programs(argv))


def sets_valve(argv, heredocs):
    """The opt-in variable of the route test being set: a word `VAR=...`, or inside the program an interpreter runs."""
    if any(w.startswith(VALVE_VAR + "=") for w in argv):
        return True
    programs = inline_programs(argv)
    if any(ROUTE_INTERPRETERS.match(os.path.basename(w)) for w in argv):
        programs += heredocs                                      # `node <<EOF process.env.VAR = '1' ... EOF`
    return any(VALVE_SET.search(p) for p in programs)


def calls_route(argv, heredocs):
    """Rule 6 for one command: it reaches the route, or an interpreter runs a heredoc program that calls the route."""
    return reaches_route(argv) or (any(ROUTE.search(b) and HTTP_CALL.search(b) for b in heredocs)
                                   and any(ROUTE_INTERPRETERS.match(os.path.basename(w)) for w in argv))


def judge_file(name, cwd, depth):
    """A script the command runs (`sh file`, `source file`, `bash -c "$(cat file)"`), read from the cwd if it exists."""
    body = read_message_file(name, cwd)
    if body is None:
        return False
    try:
        return judge(body, cwd, depth + 1, body)
    except ValueError:                                                # a file shlex cannot read: the crude test, never a free pass
        return crude(body)


def judge(command, cwd, depth=0, whole=None):
    """True when the command must be refused. `whole` is the complete top-level text (rule 1 looks at all of it)."""
    whole = command if whole is None else whole
    flat, heredocs = lift_heredocs(command)
    cmds = simple_commands(flat)
    for argv in cmds:
        if sets_valve(argv, heredocs) or calls_route(argv, heredocs):     # rules 5 and 6 (F52)
            SEEN.append("route")
            return True
        a = strip_prefix(argv)
        if not a:
            continue
        if touches_passkey_trust(a):
            SEEN.append("passkey")
            return True
        base = os.path.basename(a[0])
        if depth < MAX_DEPTH:
            if base in SHELLS or base in ("source", "."):
                script = None
                for k, w in enumerate(a[1:], 1):
                    if re.match(r"^-[A-Za-z]*c[A-Za-z]*$", w) and k + 1 < len(a):
                        script = a[k + 1]
                        break
                if script is not None and (judge(script, cwd, depth + 1, whole)
                                           or any(judge_file(f, cwd, depth) for f in CAT_SUBST.findall(script))):
                    return True
                if script is None and any(judge(b, cwd, depth + 1, whole) for b in heredocs):   # `bash <<EOF`
                    return True
                if script is None:                                    # `sh file`, `zsh < file`, `source file`, `cat file | sh`
                    redirected = a[a.index("<") + 1:a.index("<") + 2] if "<" in a else []
                    files = redirected or [w for w in a[1:] if not w.startswith("-") and w != "<"][:1]
                    piped = [x for other in cmds if other is not argv and os.path.basename(other[0]) == "cat"
                             for x in other[1:] if not x.startswith("-")] if not files else []
                    if any(judge_file(f, cwd, depth) for f in files + piped):
                        return True
            elif base == "eval" and len(a) > 1 and (judge(" ".join(a[1:]), cwd, depth + 1, whole)
                                                    or any(judge_file(f, cwd, depth) for f in CAT_SUBST.findall(" ".join(a[1:])))):
                return True
        if calls_acceptance_route(a):
            return True
        if base in INTERPRETERS and any(ACCEPTANCE_URL.search(b) for b in heredocs):     # `python3 <<EOF ... urlopen('http://127.0.0.1:8765/acceptances') EOF`
            return True
        if depth < MAX_DEPTH and a[0].startswith(("./", "../")) and judge_file(a[0], cwd, depth):   # `./run.sh`: the script, read
            return True
        parts = git_parts(a)
        if parts is None:
            continue
        sub, rest, cdir, configs = parts
        if sub in ("apply", "am", "commit") and BATCH_DIR.search(whole):
            return True
        if sub in COMMITS and any(TRAILER_ALIAS.match(c) for c in configs):   # `git -c trailer.x.key=Human-accepted commit --trailer x=F48`
            SEEN.append("human-accepted")
            return True
        if sub == "config" and any(STAMP_WORD.search(w) for w in rest) and any("trailer." in w for w in rest):
            SEEN.append("human-accepted")                                     # `git config trailer.x.key Human-accepted`
            return True
        if sub in COMMITS:
            where = str(Path(cwd) / cdir) if cdir else cwd
            others = [w for other in cmds if other is not argv for w in other]
            if commit_carries_stamp(rest, where, heredocs, others, whole):
                return True
    return False


def crude(command):
    """The fallback when shlex cannot read the command: two signals together, never one alone."""
    if VALVE_SET.search(command) or re.search(r"(?:^|[\s;&|(])" + VALVE_VAR + "=", command):
        SEEN.append("route")
        return True
    if ROUTE.search(command) and re.search(r"\b(" + "|".join(sorted(ROUTE_CLIENTS)) + r"|python[0-9.]*|node|deno|bun|ruby|perl|php)\b", command):
        SEEN.append("route")
        return True
    if ACCEPTANCE_URL.search(command) and (re.search(r"\b(curl|wget|xh|http|https|node|python3?|ruby|perl|php|deno|bun)\b", command)
                                          and (re.search(r"(?:^|\s)(-X|--request|-d|-F|-T|--form\S*|--upload-file|--data\S*|--json|--post-data)(?:\s|=|$)",
                                                         command) or re.search(r"\b(node|python3?|ruby|perl|php|deno|bun)\b", command))):
        return True
    if not (re.search(r"\bgit\b", command) and re.search(r"\b(apply|am|commit)\b", command)):
        return False
    if BATCH_DIR.search(command):
        return True
    return bool(re.search(r"\bcommit\b", command)) and bool(
        re.search(r"(?im)(?:^|['\"=])[ \t]*(?:Catalog-editorial|Human-accepted|Human-reopened|Human-prioritized):", command.replace("\\n", "\n")))


def main():
    try:
        data = json.load(sys.stdin)
        if not isinstance(data, dict):
            raise ValueError("a entrada não é um objeto JSON")
    except Exception as exc:
        print(f"catalog-marks-guard: não avaliou ({exc})", file=sys.stderr)
        return 0
    try:
        if data.get("tool_name") != "Bash":
            return 0
        command = (data.get("tool_input") or {}).get("command")
        if not isinstance(command, str) or not command.strip():
            return 0
        cwd = str(data.get("cwd") or os.getcwd())
        try:
            refuse = judge(command, cwd)
        except ValueError:                                         # shlex: unbalanced quote and the like
            refuse = crude(command)
    except Exception as exc:
        print(f"catalog-marks-guard: não avaliou ({exc})", file=sys.stderr)
        return 0
    if refuse:
        print(REFUSAL_PASSKEY if "passkey" in SEEN else REFUSAL_ROUTE if "route" in SEEN else REFUSAL_ACCEPTANCE if ACCEPTANCE_SIGNAL.search(command) or any(k.startswith("human-") for k in SEEN) else REFUSAL, file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
