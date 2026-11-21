# cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
"""
_report.py - what a doctor check writes into: the report of findings (F73 R5).

A `Report` collects findings (error, warning, not evaluable) and notes; the checks of the doctor receive it and call
`fail`, `warn`, `unevaluable` and `note`. Each finding carries the id of its check, the message, the incident that created
the check, and the file the message names (the Control Center shows area, since when, file and rule: S-133 R5).
"""
import re


ERRO, AVISO = "erro", "aviso"


# 2026-10-19 (MJRP Personal's conform): a sensor that could not compare with its source is neither green nor a warning - the
# conform cannot close "green" beside it. The doctor's exit code is unchanged (0 unless an error); the report says it apart.
NAO_AVALIAVEL = "nao_avaliavel"


# A message that opens with a repository path ("MEMORY.md: ...", "docs/log.md: ...") names the
# file of the finding. The Control Center's Health Check shows area, since when, FILE and rule
# for each open finding (S-133 R5); until 2026-10-10 the ledger carried only the text.
# F71 R14: tolerates the variations the messages really come in -- the path wrapped in backticks or quotes
# (`docs/log.md`: ...), a leading ./, an upper-case extension, a `:line` after the path.
_FILE_PREFIX = re.compile(r"""^[`'"(]?(?:\./)?([\w.\-]+(?:/[\w.\-]+)*\.(?i:md|ya?ml|json|py|html|txt|sh))[`'")]?(?=[\s:,;]|$)""")


def _file_from_msg(msg):
    m = _FILE_PREFIX.match(msg)
    return m.group(1) if m else None


class Report:
    def __init__(self):
        self.findings = []   # (id, level, msg, incident, file)
        self.notes = []      # (id, text) - what was evaluated and passed, or could not be evaluated
        self.crashed = []    # ids of the checks that raised (F73 R6): the criterion could not be evaluated

    def fail(self, cid, msg, incident, file=None):
        self.findings.append((cid, ERRO, msg, incident, file or _file_from_msg(msg)))

    def warn(self, cid, msg, incident, file=None):
        self.findings.append((cid, AVISO, msg, incident, file or _file_from_msg(msg)))

    def unevaluable(self, cid, msg, incident, file=None):
        """The check could not compare with the source (no skill installed here, the source not reachable): not evaluable."""
        self.findings.append((cid, NAO_AVALIAVEL, msg, incident, file or _file_from_msg(msg)))

    def note(self, cid, msg):
        self.notes.append((cid, msg))

    @property
    def errors(self):
        return [f for f in self.findings if f[1] == ERRO]

    @property
    def warnings_(self):
        return [f for f in self.findings if f[1] == AVISO]

    @property
    def unevaluable_(self):
        return [f for f in self.findings if f[1] == NAO_AVALIAVEL]
