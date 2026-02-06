export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/partner/login",
      permanent: false,
    },
  };
}

export default function Home() {
  return null;
}
