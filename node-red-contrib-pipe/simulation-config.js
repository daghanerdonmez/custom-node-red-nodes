module.exports = function(RED) {
    function SimulationConfigNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        
        // Store the configuration parameters
        this.name = config.name || "Simulation Configuration";
        this.outputResults = config.outputResults || false;
        this.graphicsOn = config.graphicsOn || true;
        this.mode = parseInt(config.mode) || 1;
        this.timeToRun = parseFloat(config.timeToRun) || 500;
        this.dt = parseFloat(config.dt) || 0.01;
        this.iterationsPerFrame = parseInt(config.iterationsPerFrame) || 10;
        this.diffusionCoefficient = parseFloat(config.diffusionCoefficient) || 7.94e-11;
        this.graphicsZoomMultiplier = parseFloat(config.graphicsZoomMultiplier) || 1e+03;
        
        // Calculate number of iterations based on timeToRun and dt
        this.numberOfIterations = parseInt(this.timeToRun / this.dt);
        
        // Set initial status
        node.status({fill:"grey", shape:"dot", text:"Configuration Set"});
        
        // Handle input messages (although this node doesn't typically receive messages)
        node.on("input", function(msg) {
            // If we receive a message, we could return the configuration
            msg.payload = {
                outputResults: node.outputResults,
                graphicsOn: node.graphicsOn,
                mode: node.mode,
                timeToRun: node.timeToRun,
                dt: node.dt,
                numberOfIterations: node.numberOfIterations,
                iterationsPerFrame: node.iterationsPerFrame,
                diffusionCoefficient: node.diffusionCoefficient,
                graphicsZoomMultiplier: node.graphicsZoomMultiplier
            };
            node.send(msg);
        });
    }
    
    RED.nodes.registerType("simulation-config", SimulationConfigNode);
};
