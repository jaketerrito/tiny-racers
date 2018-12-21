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
from keras.optimizers import RMSprop
from keras import backend as K
from collections import deque
import tensorflow as tf

class DQNAgent:
    def __init__(self, state_size, action_size):
        self.state_size = state_size
        self.action_size = action_size
        self.memory = deque(maxlen=900000)
        self.min_length = 500000 # number of purely explorational steps
        self.batch_size = 32 # how many state/action pairs are looked at during each replay
        self.gamma = 0.99    # discount rate
        self.epsilon = 1.0  # exploration rate
        self.converge_step = 40000 # how long we wait to update target model
        self.epsilon_min = 0.01
        self.epsilon_decay = 0.9995
        self.training_steps = 0
        self.model = self._build_model()
        self.target_model = self._build_model()
        self.update_target_model()

    """Huber loss for Q Learning
    References: https://en.wikipedia.org/wiki/Huber_loss
                https://www.tensorflow.org/api_docs/python/tf/losses/huber_loss
    """

    def _huber_loss(self, y_true, y_pred, clip_delta=1.0):
        error = y_true - y_pred
        cond  = K.abs(error) <= clip_delta

        squared_loss = 0.5 * K.square(error)
        quadratic_loss = 0.5 * K.square(clip_delta) + clip_delta * (K.abs(error) - clip_delta)

        return K.mean(tf.where(cond, squared_loss, quadratic_loss))

    def _build_model(self):
        # Neural Net for Deep-Q learning Model
        model = Sequential()
        model.add(Dense(32, input_dim=self.state_size, activation='relu'))
        model.add(Dense(24, activation='relu'))
        model.add(Dense(self.action_size, activation='linear'))
        model.compile(loss=self._huber_loss,
                      optimizer=RMSprop(lr=0.00025, rho=0.95, epsilon=0.01))
        return model

    def update_target_model(self):
        # copy weights from model to target_model
        self.target_model.set_weights(self.model.get_weights())
        self.model.save_weights("./weights/agentweights-{}.hdf5".format(time.time()))


    def remember(self, state, action, reward, next_state, done):
        self.memory.append((state, action, reward, next_state, done))

    def act(self, state):
        if np.random.rand() <= self.epsilon:
            action =  random.randrange(self.action_size)
        else:
            action = np.argmax(self.model.predict(state)[0])
        print(action)
        sys.stdout.flush()
        return action

    def replay(self):
        if len(self.memory) < self.min_length:
            return

        minibatch = random.sample(self.memory, self.batch_size)
        for state, action, reward, next_state, done in minibatch:
            target = self.model.predict(state)  
            if done:
                target[0][action] = reward
            else:
                t = self.target_model.predict(next_state)[0]
                target[0][action] = reward + self.gamma * np.amax(t)
            self.model.fit(state, target, epochs=1, verbose=0)
            self.training_steps += 1
            if self.training_steps % self.converge_step == 0:
                self.update_target_model()

        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay

    def load(self, name):
        self.model.load_weights(name)
 


def main(weights):
    training_freq = 4
    count = 0
    state = None
    next_state = None
    reward = None
    action = None
    done = False
    agent = DQNAgent(25,9)
    start_time = time.time()
    if weights != 'None':
        agent = DQNAgent(25,9) 
        agent.load(weights)
        agent.epsilon = 0.01

    for line in sys.stdin:
        if reward is None:
            reward  = float(line.split()[1].split(',')[0])
        elif state is None:
            state = np.reshape(np.array(json.loads(line[:-1])).flatten(), (1,25))
            action = agent.act(state)

        # expects "score {score}"
        if "score" in line:
            reward = float(line.split()[1].split(',')[0])
            done = False
            if reward == -1: # We don't want rewards to carry over from previous crash. so we replay and forget about past attempt
                done = True
            if count > 60:
                if agent.training_steps % 1000000 == 0 and agent.training_steps != 0:
                    hrs = (time.time() - start_time) / (60*60)
                    sys.stderr.write("{} million steps in {} hours.".format(agent.training_steps/1000000, hrs))
                    sys.stderr.flush()
                agent.replay()
                count = 0
        else:
            # line np.array(json.loads(line[:-1]))xpected to be "[0,1,2,....]"
            next_state = np.reshape(np.array(json.loads(line[:-1])).flatten(), (1,25))
            agent.remember(state, action, reward, next_state, done)
            state = next_state
            action = agent.act(state)
            count += 1

if __name__ == '__main__':
    main(sys.argv[-1])