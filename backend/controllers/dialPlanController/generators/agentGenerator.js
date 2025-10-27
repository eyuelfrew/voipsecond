/**
 * Generates Asterisk dialplan code for agent extensions.
 * This function creates extension bindings for agents/users.
 *
 * @param {Array<Object>} allAgents An array of agent/extension objects from the database.
 * @returns {string} The complete Asterisk dialplan code for agents.
 */
const generateAgentDialplan = (allAgents) => {
  let agentBindings = '';
  
  allAgents.forEach(agent => {
    if (agent.userExtension) {
      agentBindings += `exten => ${agent.userExtension},1,NoOp(Dialing Agent: ${agent.displayName || agent.userExtension})\n`;
      agentBindings += `same => n,Dial(PJSIP/${agent.userExtension},30)\n`;
      agentBindings += `same => n,Hangup()\n`;
    }
  });
  
  return agentBindings.trim() + '\n';
};

module.exports = { generateAgentDialplan };