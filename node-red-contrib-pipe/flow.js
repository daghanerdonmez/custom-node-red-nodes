module.exports = function(RED) {
    function FlowNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        
        // Store the configuration
        this.name = config.name || "Flow";
        this.flowValue = parseFloat(config.flowValue) || 1;
        
        // Set initial status
        node.status({fill:"grey", shape:"ring", text:"Ready"});
        
        // Handle HTTP request from button click
        RED.httpAdmin.post("/flow/:id", RED.auth.needsPermission("flow.write"), function(req, res) {
            var flowNode = RED.nodes.getNode(req.params.id);
            if (flowNode) {
                // Initiate flow
                initiateFlow(flowNode);
                res.sendStatus(200);
            } else {
                res.sendStatus(404);
            }
        });
        
        // Function to initiate flow from this node
        function initiateFlow(flowNode) {
            // Change status to indicate flow is active
            flowNode.status({fill:"blue", shape:"dot", text:"Active"});
            
            // Get connected pipe nodes
            var wires = flowNode.wires[0];
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
                    var pipeRadii = {};
                    
                    connectedPipes.forEach(function(pipeNode) {
                        var radius = parseFloat(pipeNode.radius) || 0.01;
                        totalR4 += Math.pow(radius, 4);
                        pipeRadii[pipeNode.id] = radius;
                    });
                    
                    // Distribute flow proportionally to r^4
                    connectedPipes.forEach(function(pipeNode) {
                        var radius = parseFloat(pipeNode.radius) || 0.01;
                        var r4Ratio = Math.pow(radius, 4) / totalR4;
                        var distributedFlow = flowNode.flowValue * r4Ratio;
                        
                        // Send initiateFlow command to connected pipe
                        pipeNode.receive({
                            payload: {
                                command: "initiateFlow",
                                flowValue: distributedFlow
                            }
                        });
                    });
                }
            }
            
            // Reset status after a short delay
            setTimeout(function() {
                flowNode.status({fill:"grey", shape:"ring", text:"Ready"});
            }, 1500);
        }
        
        // Handle input messages (although flow node doesn't typically receive messages)
        node.on("input", function(msg) {
            // If we receive a message, we could optionally trigger the flow
            // For now, we'll just pass it through
            node.send(msg);
        });
    }
    
    RED.nodes.registerType("flow", FlowNode);
};
