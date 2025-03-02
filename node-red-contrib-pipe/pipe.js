// Fixed pipe.js
module.exports = function(RED) {
    function PipeNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        
        // Store the receivers configuration
        this.receivers = config.receivers || [];

        node.on("input", function(msg) {
            msg.payload = {
                name: config.name || "unnamed",
                length: parseFloat(config.length),
                radius: parseFloat(config.radius),
                particle_count: parseInt(config.particle_count),
                connections: config.connections ? config.connections.split(",") : [],
                receivers: config.receivers || []
            };
            node.send(msg);
        });
    }

    RED.nodes.registerType("pipe", PipeNode);
};