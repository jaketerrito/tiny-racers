import numpy as np
import json
import sys
import math
import time
import keras
import random
from keras.models import Sequential
from keras.layers import Dense, Flatten
from keras.layers import Conv2D, MaxPooling2D
from collections import deque

class Agent:
    def __init__(self, file=None, batch_size=None):
        self.memory = deque(maxlen=batch_size) # maxlen is number of frames to remember
        self.gamma = 0.3
        self.epsilon = 1.0
        self.epsilon_min = 0.001
        self.epsilon_decay = 0.995
        self.action_size = 9
        self.model = self.build_model(file)
        self.target_model = self.build_model(file)
        self.batch_size = batch_size
        self.last = 4

    def build_model(self, file):
        model = Sequential()
        model.add(Dense(12, activation='relu', input_dim=13))
        model.add(Dense(8, activation='relu'))
        model.add(Dense(self.action_size, activation='softmax'))

        if file != None:
           model.load_weights(file)

        model.compile(loss='mse', optimizer='adam')
        return model

    def update_target_model(self):
        self.target_model.set_weights(self.model.get_weights())

    def remember(self, state, action, reward, next_state, done):
        self.memory.append((state, action, reward, next_state, done))

    def replay(self):
        sys.stderr.write("Python: Training\n")
        sys.stderr.flush()
        if len(self.memory) >= self.batch_size:
            minibatch = random.sample(self.memory, math.floor(self.batch_size/2))
        else:
            minibatch = random.sample(self.memory, math.floor(len(self.memory)))

        for state, action, reward, next_state, done in minibatch:
            target_action = reward

            # Possibly switch model and target_model below
            if not done:
                target = self.model.predict(next_state)
                target_val = self.target_model.predict(state)[0].flatten()
                target[0][action] = reward + self.gamma * \
                    np.amax(target_val[0])
                   
            self.model.fit(state, target, epochs=1, verbose=0)

        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay

    def act(self, state):
        if np.random.rand() <= self.epsilon:
            action = np.random.rand(self.action_size)
        else:
            action = self.model.predict(state)[0]
        action = np.argmax(action)
        print(action)
        sys.stdout.flush()
        return action

# Take's a config, a list of inputs, and outputs predictions. 
def main(weights):
    sys.stderr.write("Python: Starting Model\n")
    sys.stderr.flush()
    batch_size = 3600
    batch_count = 0
    count = 0
    sum_reward = 0
    state = None
    next_state = None
    reward = None
    action = None
    if weights != 'None':
        agent = Agent(file=weights, batch_size=batch_size)
    else:
        agent = Agent(file=None, batch_size=batch_size)

    for line in sys.stdin:
        if reward is None:
            reward  = float(line.split()[1].split(',')[0])
        elif state is None:
            state = np.reshape(np.array(json.loads(line[:-1])).flatten(), (1,13))
            action = agent.act(state).flatten() 

        # expects "score {score}" as final line
        if "score" in line:
            reward = float(line.split()[1].split(',')[0])
            sum_reward += reward
            if reward == -1000: # We don't want rewards to carry over from previous crash. so we replay and forget about past attempt
                agent.replay()
                agent.memory.clear()
                agent.model.save_weights("./weights/agentweights-{}.hdf5".format(sum_reward/count))
                sys.stderr.write("Python: Average reward = " + str(sum_reward/count) + "\n")
                sys.stderr.flush()
                count = 0
                sum_reward = 0
                batch_count += 1
        else:
            # line np.array(json.loads(line[:-1]))xpected to be "[0,1,2,....]"
            next_state = np.reshape(np.array(json.loads(line[:-1])).flatten(), (1,13))
            agent.remember(state, action, reward, next_state, False)
            state = next_state
            action = agent.act(state).flatten()
            count += 1

        if count > batch_size:
            agent.replay()
            agent.model.save_weights("./weights/agentweights-{}.hdf5".format(sum_reward/count))
            sys.stderr.write("Python: Average reward = " + str(sum_reward/count) + "\n")
            sys.stderr.flush()
            count = 0
            sum_reward = 0
            batch_count += 1
        if batch_count > 4:
            batch_count = 0
            agent.update_target_model()

if __name__ == '__main__':
    main(sys.argv[-1])
