import glob
import os
import time
import json
import operator
import random

def mate(lover1,lover2):
	return lover1['wgts']

def mutate(organism):
	return


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
# Mates, crossing over values with another organism (Rate in range 30-70%) -- For humans the rate is 50%, but I thought some extra variation could speed up training
# Mate randomly with higher scoring organisms -- could be a bad idea! Hopefully it will make worse genes die out.
# -- May want to add functionality beyond just swapping values
# Has 50% chance of Mutating from 0-10% of its genes -- may want to have it 0-100% but skewed heavily towards 0
# -- Could store score's of ancestors, using that in determing value of genes
for i,organism in enumerate(population):
	organism['wgts'] = mate(organism,population[random.randint(i,population_size-1)])
	if random.choice([True,False]):
		mutate(organism)
	with open("data/current_batch/" + str(i) + ".cfg",'w') as file:
		json.dump(organism,file,indent=4)

print(glob.glob("data/current_batch/*.cfg"))