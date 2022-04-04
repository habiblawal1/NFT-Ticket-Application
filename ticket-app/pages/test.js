function TestPage({ characters }) {
  return (
    <div>
      <h1>Me testing out Next.JS</h1>
      {characters.map((character) => {
        return <li key={character.id}>{character.name}</li>;
      })}
    </div>
  );
}

export const getStaticProps = async (context) => {
  const res = await fetch("https://rickandmortyapi.com/api/character");
  const { results } = await res.json();

  return {
    props: {
      characters: results,
    },
  };
};

export default TestPage;
