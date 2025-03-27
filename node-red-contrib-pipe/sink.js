module.exports = function(RED) {
    function SinkNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        
        // Store the configuration
        this.name = config.name || "Sink";
        
        // Initialize with no flow
        node.status({fill:"grey", shape:"ring", text:"No flow"});
        
        // Restore flow state from context if available
        var flowState = this.context().get('flowState');
        if (flowState) {
            updateStatus(flowState);
        }
        
        // Function to update node status based on flow
        function updateStatus(flowValue) {
            if (flowValue > 0) {
                node.status({fill:"blue", shape:"dot", text:"Flow: " + flowValue.toFixed(2)});
            } else {
                node.status({fill:"grey", shape:"ring", text:"No flow"});
            }
        }
        
        node.on("input", function(msg) {
            // Check if this is a flow command
            if (msg.payload && msg.payload.command) {
                switch(msg.payload.command) {
                    case "initiateFlow":
                    case "propagateFlow":
                        // Get the incoming flow value
                        var incomingFlow = parseFloat(msg.payload.flowValue) || 0;
                        
                        // Store flow state in context
                        node.context().set('flowState', incomingFlow);
                        
                        // Update status
                        updateStatus(incomingFlow);
                        break;
                        
                    default:
                        // Ignore other commands
                        break;
                }
            } else {
                // For non-command messages, just update status to show we received something
                node.status({fill:"green", shape:"dot", text:"Message received"});
                
                // Reset status after a short delay
                setTimeout(function() {
                    var flowState = node.context().get('flowState') || 0;
                    updateStatus(flowState);
                }, 1500);
            }
        });
    }
    
    RED.nodes.registerType("sink", SinkNode);
};
