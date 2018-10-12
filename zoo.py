import glob
import os
import time
import json
import operator
import random
import sys
import numpy as np
	
# Mates, crossing over values with another organism 
# For humans the rate is 50% so each gene(matrix value) has same chance of being from lover1 or lover2
def mate(lover1,lover2):
	wgts1 = np.array(lover1['wgts'])
	wgts2 = np.array(lover2['wgts'])
	results = []
	for i in range(len(wgts1)):
		wgts1current= np.array(wgts1[i])
		wgts2current= np.array(wgts2[i])
		crossover = np.random.random_integers(0,1,wgts1current.shape)
		results.append((wgts1current * crossover + wgts2current * (np.ones(wgts1current.shape).astype(int) - crossover)).tolist())
	return results

def mutate(organism,rate):
	wgts = np.array(organism['wgts'])
	results = []
	for i in range(len(wgts)):
		wgt = np.array(wgts[i]) # need to make my own function to produce better random distribution
		results.append((wgt + ((np.random.normal(scale=.1,size=wgt.shape) - .5) * rate)).tolist())
	return results


files = glob.glob("data/current_batch/*.cfg")
for file in files:
	os.remove(file)

# Put previous generation in the grave
destination = 'data/graveyard-' + str(time.time())
os.makedirs(destination)
files = glob.glob("data/*.cfg")
for file in files:
	os.rename(file, destination + "/" + os.path.basename(file))

# Loads the previous generation
files = glob.glob(destination + "/*.cfg")
population = []
for file in files:
	with open(file) as data:
		population.append(json.load(data))
population_size = len(population)

# Sort Population by score from highest to lowest
population.sort(key=operator.itemgetter('score'),reverse=True)
# Mate randomly with higher scoring organisms -- could be a bad idea! Hopefully it will make worse genes die out.
# -- May want to add functionality beyond just swapping values
# Has 50% chance of Mutating from 0-10% of its genes -- may want to have it 0-100% but skewed heavily towards 0
# -- Could store score's of ancestors, using that in determing value of genes
for i,organism in enumerate(population[int(population_size/2):]):
	new = {}
	for j in range(2): # need to have clever way to randomly select survivors
		new['wgts'] = mate(organism,population[random.randint(i,population_size-1)])
		new['wgts'] = mutate(organism,1-i/population_size)
		new['arch'] = organism["arch"]
		new['score'] = organism['score']
		with open("data/current_batch/" + str(i) + "-" + str(j) +".cfg",'w') as file:
			json.dump(new,file,indent=4)
print(glob.glob("data/current_batch/*.cfg"))
sys.stdout.flush()
