module.exports = function(RED) {
    function FlowNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        
        // Store configuration
        this.name = config.name || "Flow";
        this.flowRate = parseFloat(config.flowRate) || 1.0;
        
        // Set initial status
        node.status({
            fill: "gray",
            shape: "ring",
            text: "Ready (Flow: " + this.flowRate.toFixed(2) + ")"
        });
        
        // Handle messages from the runtime, including button clicks
        this.on('input', function(msg) {
            // If this is a button click or a normal message
            initiateFlow(node);
        });
        
        // Handle manually triggered flow
        this.initiateFlow = function() {
            initiateFlow(node);
            return { status: "success" };
        };
    }
    
    // Function to initiate flow when button is clicked
    function initiateFlow(node) {
        // Create flow command message
        var msg = {
            payload: {
                flowCommand: "initiateFlow",
                flowRate: node.flowRate,
                sourceNodeId: node.id
            }
        };
        
        // Update status to show flow is active
        node.status({
            fill: "green",
            shape: "dot",
            text: "Active (Flow: " + node.flowRate.toFixed(2) + ")"
        });
        
        // Send the message
        node.send(msg);
        
        // Reset status after a delay (optional)
        setTimeout(function() {
            node.status({
                fill: "gray",
                shape: "ring",
                text: "Ready (Flow: " + node.flowRate.toFixed(2) + ")"
            });
        }, 3000);
    }
    
    // Register the node
    RED.nodes.registerType("flow", FlowNode);
    
    // Create the HTTP endpoint for initiating flow
    RED.httpAdmin.post("/flow/initiate/:id", RED.auth.needsPermission("flows.write"), function(req, res) {
        var node = RED.nodes.getNode(req.params.id);
        if (node && node.type === "flow") {
            try {
                var result = node.initiateFlow();
                res.status(200).send(result);
            } catch(err) {
                res.status(500).send({error: "Error initiating flow: " + err.toString()});
            }
        } else {
            res.status(404).send({error: "Node not found"});
        }
    });
};