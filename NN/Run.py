import numpy as np
import numpy.random as rnd
import json
import sys
import math


class Layer:
    def __init__(self, dim, prev, act, weights=None):
        self.dim = dim
        self.prev = prev
        self.act = None
        self.zs = None
        self.outputs = None
        if(prev is not None):
            self.act = act
        self.in_weights = None
        if(weights is not None):
            self.in_weights = weights
        else:
            if(prev is not None):
                self.in_weights = rnd.rand(dim,prev.dim+1)

    def get_dim(self):
        return self.dim

    def set_weights(self, weights=None):
        if(weights is None):
            weights = rnd.rand(self.dim,self.prev.dim+1)
        self.in_weights = weights
        return self.in_weights

    # Compute self.outputs, using vals if given, else using outputs from
    # previous layer and passing through our in_weights and activation.
    def propagate(self, vals=None):
        if(self.in_weights is None):
            self.zs = None
            self.outputs = vals
            return
        inputs = self.prev.outputs
        if(vals is not None):
            inputs = vals
        inputs = np.vstack((inputs,1))
        self.zs = np.dot(self.in_weights, inputs)
        self.outputs = self.act(self.zs)


class Network:
    # arch -- list of (dim, act) pairs
    # err -- error function: "cross_entropy" or "mse"
    # wgts -- list of one 2-d np.array per layer in arch
    def __init__(self, arch, wgts=None):
        self.layers = []
        prev = None
        wgt = None
        for i, layer in enumerate(arch):
            if(wgts is not None and i > 0):
                wgt = np.array(wgts[i-1])
            if(i > 0):
                prev = self.layers[-1]
            self.layers.append(Layer(
                layer[0],
                prev,
                get_function(layer[1]),
                weights=wgt
            ))
        self.weights = []
        for layer in self.layers:
            self.weights.append(layer.in_weights)

    def set_weights(self, wgts=None):
        self.weights = []
        for layer in self.layers[1:]:
            self.weights.append(layer.set_weights(wgts))
        return self.weights

    # Forward propagate, passing inputs to first layer, and returning outputs
    # of final layer
    def predict(self, inputs):
        #normalize input
        inputs = inputs/inputs.max()
        self.layers[0].propagate(vals=inputs)
        for layer in self.layers[1:]:
            layer.propagate()
        return self.layers[-1].outputs

def get_function(form):
    if(form == 'relu'):
        return lambda z: (z > 0) * z
    elif(form == 'softmax'):
        return lambda z: np.exp(z) / np.sum(np.exp(z), axis=0)

class Organism:
    def __init__(self, arch, parents = None, weights=None, score=None):
        #network only used for training and is same for each, weights is what matters
        self.net = Network(arch,weights)
        self.score = score
        self.parents = None
        self.weights = self.net.weights

    def mutate(self, coverage, degree):
        # change a certain coverage of weights based off degree
        self.weights = self.net.set_weights()

    def react(self,inputs):
        return self.net.predict(inputs)

# Take's a config, a list of inputs, and outputs predictions. 
def main(cfg_file):
    with open(cfg_file) as file:
        cfg = json.load(file)
    if('wgts' in cfg):
        organism = Organism(cfg['arch'],weights=cfg['wgts'])
    else:
        organism = Organism(cfg['arch'])

    i = 0
    for line in sys.stdin:
        # expects "score {score}" as final line
        if "score" in line:
            organism.score = int(line.split()[1])
            print("Organism {}, score {}".format(i, organism.score))
            i += 1
            organism.mutate(0,0)
        else:
            # line expected to be "[0,1,2,....]"
            print(organism.react(np.array(json.loads(line))))

if __name__ == '__main__':
    main(sys.argv[1])