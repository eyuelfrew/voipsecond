    import React, { useCallback } from 'react';
    import { Agent } from '../../types/queueTypes'; // Assuming Agent type is now imported from types/queue
    import { Users, UserPlus, UserMinus } from 'lucide-react';

    // Props for the QueueAgentsTab component
    interface QueueAgentsTabProps {
      initialAllAgents: Agent[]; // This is now the source of truth for available agents
      initialSelectedQueueAgents: Agent[]; // This is now the source of truth for selected agents
      onAllAgentsChange: (agents: Agent[]) => void; // Callback to update parent's allAgents state
      onSelectedQueueAgentsChange: (agents: Agent[]) => void; // Callback to update parent's selectedQueueAgents state
    }

    const QueueAgentsTab: React.FC<QueueAgentsTabProps> = ({
      initialAllAgents,
      initialSelectedQueueAgents,
      onAllAgentsChange,
      onSelectedQueueAgentsChange,
    }) => {

      // Handle adding an agent to the queue immediately on select
      const handleSelectAndAddAgent = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const agentId = e.target.value;
        if (agentId) { // Ensure a valid agent is selected (not the default empty option)
          const agentToAdd = initialAllAgents.find(agent => agent.id === agentId);
          if (agentToAdd) {
            // Update selected agents in parent
            onSelectedQueueAgentsChange([...initialSelectedQueueAgents, agentToAdd]);
            // Update all agents in parent (remove the added agent)
            onAllAgentsChange(initialAllAgents.filter(agent => agent.id !== agentId));
          }
        }
      }, [initialAllAgents, initialSelectedQueueAgents, onAllAgentsChange, onSelectedQueueAgentsChange]);

      // Handle removing an agent from the queue
      const handleRemoveAgent = useCallback((agentId: string) => {
        const agentToRemove = initialSelectedQueueAgents.find(agent => agent.id === agentId);
        if (agentToRemove) {
          // Update selected agents in parent (remove the agent)
          onSelectedQueueAgentsChange(initialSelectedQueueAgents.filter(agent => agent.id !== agentId));
          // Update all agents in parent (add the agent back and sort)
          onAllAgentsChange([...initialAllAgents, agentToRemove].sort((a, b) => a.name.localeCompare(b.name)));
        }
      }, [initialAllAgents, initialSelectedQueueAgents, onAllAgentsChange, onSelectedQueueAgentsChange]);

      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-8 h-8 bg-cc-yellow-400/20 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 cc-text-accent" />
            </div>
            <h2 className="text-2xl font-bold cc-text-accent">Queue Agents</h2>
          </div>

          {/* Add Agent Section */}
          <div className="cc-glass rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <UserPlus className="h-5 w-5 cc-text-accent" />
              <h3 className="text-lg font-semibold cc-text-accent">Add Agent to Queue</h3>
            </div>
            <div className="space-y-2">
              <label htmlFor="agent-select" className="block text-sm font-semibold cc-text-primary">Select Agent</label>
              <select
                id="agent-select"
                value=""
                onChange={handleSelectAndAddAgent}
                className="w-full px-4 py-3 cc-glass border cc-border rounded-lg cc-text-primary focus:outline-none focus:ring-2 focus:ring-cc-yellow-400/50 focus:border-cc-yellow-400 cc-transition"
              >
                <option value="">-- Select an Agent --</option>
                {initialAllAgents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.extension})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Agents List */}
          <div className="cc-glass rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Users className="h-5 w-5 cc-text-accent" />
              <h3 className="text-lg font-semibold cc-text-accent">Agents in this Queue</h3>
              <span className="px-2 py-1 bg-cc-yellow-400/20 cc-text-accent rounded-full text-xs font-medium">
                {initialSelectedQueueAgents.length}
              </span>
            </div>
            
            {initialSelectedQueueAgents.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-cc-yellow-400/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 cc-text-accent opacity-50" />
                </div>
                <p className="cc-text-secondary">No agents added to this queue yet</p>
                <p className="cc-text-secondary text-sm mt-1">Select agents from the dropdown above to add them</p>
              </div>
            ) : (
              <div className="space-y-3">
                {initialSelectedQueueAgents.map((agent, index) => (
                  <div key={agent.id} className={`flex justify-between items-center p-4 rounded-xl cc-transition hover:bg-cc-yellow-400/5 group ${index % 2 === 0 ? 'bg-black/5 dark:bg-white/5' : 'cc-glass'}`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-cc-yellow-400/20 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 cc-text-accent" />
                      </div>
                      <div>
                        <span className="cc-text-primary font-medium">{agent.name}</span>
                        <div className="text-xs cc-text-secondary">Extension: {agent.extension}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAgent(agent.id)}
                      className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 cc-transition transform hover:scale-110 group-hover:opacity-100 opacity-70"
                      title="Remove Agent"
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    };

    export default QueueAgentsTab;
    