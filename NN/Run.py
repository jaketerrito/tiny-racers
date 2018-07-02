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
            if(weights is None):
                weights = rnd.rand(dim, prev.dim+1)
        self.in_weights = weights

    def get_dim(self):
        return self.dim

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
        inputs = np.vstack((inputs, 1))
        self.zs = np.dot(self.in_weights, inputs)
        self.outputs = self.act(self.zs)

    # Return string description of self for debugging
    def __repr__(self):
        return self.in_weights


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

    # Forward propagate, passing inputs to first layer, and returning outputs
    # of final layer
    def predict(self, inputs):
        self.layers[0].propagate(vals=inputs)
        for layer in self.layers[1:]:
            layer.propagate()
        return self.layers[-1].outputs

# Take's a config, a list of inputs, and outputs predictions. 
def main(cfg_file, data_file):
    with open(cfg_file) as file:
        cfg = json.load(file)
    if('wgts' in cfg):
        network = Network(cfg['arch'], cfg['err'], wgts=cfg['wgts'])
    else:
        network = Network(cfg['arch'], cfg['err'])
    with open(data_file) as file:
        data = json.load(file)

    if(cmd == 'run'):
        train = data
        for i in range(0, math.ceil(len(train)/32)):
            start = i * 32
            end = (i + 1) * 32
            if(end > len(train)):
                end = len(train)
            print('Batch {}:{}'.format(start, end))
            print('Batch error: {:.3f}'.format(
                network.run_batch(train[start:end], .01))
            )
        errors = []
        for point in validate:
            inputs = np.array(point[0]).reshape((len(point[0]), 1))
            expected = np.array(point[1]).reshape((len(point[1]), 1))
            network.predict(inputs)
            errors.append(network.get_err(expected))
        print('Validation error: {:.3f}'.format(np.mean(errors)))

def test():
    lines = sys.stdin.readlines()
    print(np.sum(np.array(json.loads(lines[0]))))

if __name__ == '__main__':
    test()
