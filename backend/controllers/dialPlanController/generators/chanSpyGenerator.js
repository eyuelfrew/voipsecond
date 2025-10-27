/**
 * Generates static ChanSpy dialplan contexts for call monitoring.
 * This function creates the targeted chanspy contexts for monitoring extensions.
 *
 * @returns {string} The complete Asterisk dialplan code for ChanSpy contexts.
 */
const generateChanSpyDialplan = () => {
  return `
[targeted-chanspy]
exten => _556.,1,NoOp(Targeted ChanSpy for extension \${EXTEN:3})
;exten => _556.,n,Authenticate(1234)
exten => _556.,n,ExecIf($["\${EXTEN:3}"="1000"]?Hangup)
exten => _556.,n,ChanSpy(PJSIP/\${EXTEN:3},q)
exten => _556.,n,Hangup

[targeted-chanspy-whisper]
exten => _557.,1,NoOp(Targeted ChanSpy Whisper for extension \${EXTEN:3})
;exten => _557.,n,Authenticate(1234)
exten => _557.,n,ExecIf($["\${EXTEN:3}"="1000"]?Hangup)
exten => _557.,n,ChanSpy(PJSIP/\${EXTEN:3},qw)
exten => _557.,n,Hangup

[targeted-chanspy-barge]
exten => _558.,1,NoOp(Targeted ChanSpy Barge for extension \${EXTEN:3})
;exten => _558.,n,Authenticate(1234)
exten => _558.,n,ExecIf($["\${EXTEN:3}"="1000"]?Hangup)
exten => _558.,n,ChanSpy(PJSIP/\${EXTEN:3},qB)
exten => _558.,n,Hangup
`;
};

module.exports = { generateChanSpyDialplan };