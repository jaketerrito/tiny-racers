import os
import numpy as np
import matplotlib.pyplot as plt


plt.show()
batchs = [x for x in os.listdir('./data') if 'graveyard' in x]
avgs = []
medians = []
maxs = []
for batch in batchs:
	scores = [float(x[:x[1:].index('-')]) for x in os.listdir('./data/' + batch)]
	avgs.append(np.mean(scores))
	medians.append(np.median(scores))
	maxs.append(np.max(scores))
plt.plot(avgs, label='average')
plt.plot(medians, label='median')
plt.plot(maxs, label='max')
plt.legend()
plt.savefig('performance')