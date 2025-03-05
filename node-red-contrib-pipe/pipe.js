module.exports = function(RED) {
    function PipeNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        
        // Store the configuration
        this.receivers = config.receivers || [];
        this.emitters = config.emitters || [];

        node.on("input", function(msg) {
            msg.payload = {
                name: config.name || "unnamed",
                length: parseFloat(config.length),
                radius: parseFloat(config.radius),
                receivers: config.receivers || [],
                emitters: config.emitters || []
            };
            node.send(msg);
        });
    }

    RED.nodes.registerType("pipe", PipeNode);
};