from themoviedb import TMDb

tmdb = TMDb(key="1c033e72ac78e7832e0e9b6e3f90245c")

result = tmdb.search().multi(query="József Körös")