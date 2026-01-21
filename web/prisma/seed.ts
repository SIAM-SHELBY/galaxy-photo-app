import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { slug: "street", name: "Street" },
    { slug: "portrait", name: "Portrait" },
    { slug: "landscape", name: "Landscape" },
    { slug: "architecture", name: "Architecture" },
    { slug: "wildlife", name: "Wildlife" },
    { slug: "macro", name: "Macro" },
    { slug: "travel", name: "Travel" },
    { slug: "film", name: "Film" },
    { slug: "black-and-white", name: "Black & White" },
    { slug: "minimal", name: "Minimal" },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: c,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
