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
        
        // Store the original config object for later updates
        this.originalConfig = config;
        
        // Load current flow from context or config
        var contextFlow = this.context().get('currentFlow');
        if (contextFlow !== undefined) {
            this.currentFlow = parseFloat(contextFlow);
            this.originalConfig.currentFlow = this.currentFlow;
        } else {
            this.currentFlow = parseFloat(config.currentFlow) || 0;
            this.originalConfig.currentFlow = this.currentFlow;
        }
        
        // Set the initial status
        updateNodeStatus(node);
        
        node.on("input", function(msg) {
            // Clone the msg to avoid modifying the original
            var newMsg = RED.util.cloneMessage(msg);
            
            if (newMsg.payload && newMsg.payload.flowCommand === "initiateFlow") {
                // This is a flow initiation command from a Flow node
                handleFlowCommand(node, newMsg);
            } else if (newMsg.payload && newMsg.payload.flowCommand === "propagateFlow") {
                // This is a flow propagation from another pipe
                handlePropagatedFlow(node, newMsg);
            } else {
                // This is a normal message, add flow information to the payload
                newMsg.payload = {
                    name: node.name,
                    length: node.length,
                    radius: node.radius,
                    currentFlow: node.currentFlow,
                    receivers: node.receivers,
                    emitters: node.emitters
                };
                node.send(newMsg);
            }
        });
        
        // Save flow value when node is closed or redeployed
        node.on('close', function() {
            // Save current flow to context
            node.context().set('currentFlow', node.currentFlow);
            
            // Update the original config object
            if (node.originalConfig) {
                node.originalConfig.currentFlow = node.currentFlow;
            }
        });
    }
    
    // Function to handle flow commands from Flow nodes
    function handleFlowCommand(node, msg) {
        // Set the current flow to the value from the Flow node
        node.currentFlow = msg.payload.flowRate;
        
        // Log the current flow for debugging
        node.warn("handleFlowCommand - currentFlow: " + node.currentFlow);
        
        // Save the current flow to node configuration and context
        saveFlowToConfig(node);
        
        // Update the node status to reflect the new flow
        updateNodeStatus(node);
        
        // Propagate the flow to connected pipes
        propagateFlow(node);
    }
    
    // Function to handle propagated flow from other pipes
    function handlePropagatedFlow(node, msg) {
        // Update the current flow with the propagated value
        node.currentFlow = msg.payload.flowRate;
        
        // Log the current flow for debugging
        node.warn("handlePropagatedFlow - currentFlow: " + node.currentFlow);
        
        // Save the current flow to node configuration and context
        saveFlowToConfig(node);
        
        // Update the node status
        updateNodeStatus(node);
        
        // Continue propagating the flow
        propagateFlow(node);
    }
    
    // Function to save flow value to node configuration and context
    function saveFlowToConfig(node) {
        // Save to context for persistence across restarts
        node.context().set('currentFlow', node.currentFlow);
        
        // Update the original config object
        if (node.originalConfig) {
            node.originalConfig.currentFlow = node.currentFlow;
        }
    }
    
    // Function to propagate flow to connected pipes
    function propagateFlow(node) {
        // Find all nodes connected to this node's output
        var wires = node.wires[0]; // Get array of connected node IDs
        
        if (!wires || wires.length === 0) {
            // No connected pipes, flow stops here
            return;
        }
        
        // Get all connected nodes
        var connectedNodes = [];
        wires.forEach(function(nodeId) {
            var connectedNode = RED.nodes.getNode(nodeId);
            if (connectedNode && connectedNode.type === "pipe") {
                connectedNodes.push(connectedNode);
            }
        });
        
        if (connectedNodes.length === 0) {
            // No connected pipes, flow stops here
            return;
        }
        
        // Calculate the sum of the fourth powers of pipe radii
        var totalR4 = 0;
        connectedNodes.forEach(function(connectedNode) {
            var radius = parseFloat(connectedNode.radius) || 0.01;
            totalR4 += Math.pow(radius, 4);
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