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
        this.currentFlow = 0;
        
        // Restore flow state from context if available
        var flowState = this.context().get('flowState');
        if (flowState) {
            this.currentFlow = flowState;
            updateStatus();
        } else {
            // Initialize with no flow
            updateStatus();
        }

        // Function to update node status based on flow
        function updateStatus() {
            if (node.currentFlow > 0) {
                node.status({fill:"blue", shape:"dot", text:"Flow: " + node.currentFlow.toFixed(2)});
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
                        node.currentFlow = parseFloat(msg.payload.flowValue) || 0;
                        // Store flow state in context
                        node.context().set('flowState', node.currentFlow);
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
                                    var distributedFlow = node.currentFlow * r4Ratio;
                                    
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
                        node.currentFlow = incomingFlow;
                        
                        // Store flow state in context
                        node.context().set('flowState', node.currentFlow);
                        
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
                                    var distributedFlow = node.currentFlow * r4Ratio;
                                    
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
                    currentFlow: node.currentFlow
                };
                node.send(msg);
            }

        });
        
        // Distribute flow proportionally to the fourth power of radius
        connectedNodes.forEach(function(connectedNode) {
            var radius = parseFloat(connectedNode.radius) || 0.01;
            var r4 = Math.pow(radius, 4);
            var flowRatio = r4 / totalR4;
            var distributedFlow = node.currentFlow * flowRatio;
            
            // Send flow to connected pipe
            connectedNode.receive({
                payload: {
                    flowCommand: "propagateFlow",
                    flowRate: distributedFlow,
                    parentNodeId: node.id
                }
            });
        });
    }
    
    // Function to update the node status with current flow information
    function updateNodeStatus(node) {
        if (node.currentFlow > 0) {
            node.status({
                fill: "blue",
                shape: "dot",
                text: "Flow: " + node.currentFlow.toFixed(2)
            });
        } else {
            node.status({
                fill: "gray",
                shape: "ring",
                text: "No flow"
            });
        }
    }
    
    // Register the node type with Node-RED
    RED.nodes.registerType("pipe", PipeNode);
};