module.exports = function(RED) {
    function PipeNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        
        // Store the configuration
        this.name = config.name || "unnamed";
        this.length = parseFloat(config.length) || 0.1;
        this.radius = parseFloat(config.radius) || 0.01;
        this.receivers = config.receivers || [];
        this.emitters = config.emitters || [];
        
        // Flow value variable (not stored as a node property)
        var flowValue = 0;
        
        // Restore flow state from context if available
        var flowState = this.context().get('flowState');
        if (flowState) {
            flowValue = flowState;
            updateStatus();
        } else {
            // Initialize with no flow
            updateStatus();
        }

        // Function to update node status based on flow
        function updateStatus() {
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
                        // Set the flow value from the flow node
                        flowValue = parseFloat(msg.payload.flowValue) || 0;
                        // Store flow state in context
                        node.context().set('flowState', flowValue);
                        // Update status
                        updateStatus();
                        
                        // Get connected pipe nodes
                        var wires = node.wires[0];
                        var connectedPipes = [];
                        
                        if (wires && wires.length > 0) {
                            // Get all connected pipe nodes
                            wires.forEach(function(id) {
                                var connectedNode = RED.nodes.getNode(id);
                                if (connectedNode && connectedNode.type === "pipe") {
                                    connectedPipes.push(connectedNode);
                                }
                            });
                            
                            // If there are connected pipe nodes, distribute flow based on r^4
                            if (connectedPipes.length > 0) {
                                // Calculate total r^4 for all connected pipes
                                var totalR4 = 0;
                                
                                connectedPipes.forEach(function(pipeNode) {
                                    var radius = parseFloat(pipeNode.radius) || 0.01;
                                    totalR4 += Math.pow(radius, 4);
                                });
                                
                                // Distribute flow proportionally to r^4
                                connectedPipes.forEach(function(pipeNode) {
                                    var radius = parseFloat(pipeNode.radius) || 0.01;
                                    var r4Ratio = Math.pow(radius, 4) / totalR4;
                                    var distributedFlow = flowValue * r4Ratio;
                                    
                                    // Send propagateFlow command to connected pipe
                                    pipeNode.receive({
                                        payload: {
                                            command: "propagateFlow",
                                            flowValue: distributedFlow
                                        }
                                    });
                                });
                            }
                        }
                        break;
                        
                    case "propagateFlow":
                        // Get the incoming flow value
                        var incomingFlow = parseFloat(msg.payload.flowValue) || 0;
                        
                        // Set the flow value
                        flowValue = incomingFlow;
                        
                        // Store flow state in context
                        node.context().set('flowState', flowValue);
                        
                        // Update status
                        updateStatus();
                        
                        // Get connected pipe nodes
                        var wires = node.wires[0];
                        var connectedPipes = [];
                        
                        if (wires && wires.length > 0) {
                            // Get all connected pipe nodes
                            wires.forEach(function(id) {
                                var connectedNode = RED.nodes.getNode(id);
                                if (connectedNode && connectedNode.type === "pipe") {
                                    connectedPipes.push(connectedNode);
                                }
                            });
                            
                            // If there are connected pipe nodes, distribute flow based on r^4
                            if (connectedPipes.length > 0) {
                                // Calculate total r^4 for all connected pipes
                                var totalR4 = 0;
                                
                                connectedPipes.forEach(function(pipeNode) {
                                    var radius = parseFloat(pipeNode.radius) || 0.01;
                                    totalR4 += Math.pow(radius, 4);
                                });
                                
                                // Distribute flow proportionally to r^4
                                connectedPipes.forEach(function(pipeNode) {
                                    var radius = parseFloat(pipeNode.radius) || 0.01;
                                    var r4Ratio = Math.pow(radius, 4) / totalR4;
                                    var distributedFlow = flowValue * r4Ratio;
                                    
                                    // Send propagateFlow command to connected pipe
                                    pipeNode.receive({
                                        payload: {
                                            command: "propagateFlow",
                                            flowValue: distributedFlow
                                        }
                                    });
                                });
                            }
                        }
                        break;
                        
                    default:
                        // Pass through other messages
                        node.send(msg);
                }
            } else {
                // Default behavior - pass through the message with pipe properties
                msg.payload = {
                    name: node.name,
                    length: node.length,
                    radius: node.radius,
                    receivers: node.receivers,
                    emitters: node.emitters,
                    currentFlow: flowValue // Include current flow value in the payload
                };
                node.send(msg);
            }
        });
    }

    RED.nodes.registerType("pipe", PipeNode);
};