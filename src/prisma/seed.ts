// prisma/seed.ts
import {
  PrismaClient,
  PetStat,
  ItemType,
  HabitType,
  Difficulty,
  EquipmentSlot,
  UserGroupRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting the seeding process...');

  // --- Seed Core Game Data ---
  console.log('🌱 Seeding Pet Items...');
  const items = await seedPetItems();

  console.log('🌱 Seeding Public Challenges...');
  const challenges = await seedChallenges();

  // --- Seed Users ---
  console.log('👤 Seeding user: Alice');
  const alice = await seedUser('alice@example.com', 'alice', 'Password123!', {
    habits: [
      {
        id: 'cl_habit_1',
        title: 'Exercise for 30 minutes',
        difficulty: Difficulty.MEDIUM,
      },
      {
        id: 'cl_habit_2',
        title: 'Read a book chapter',
        difficulty: Difficulty.EASY,
      },
    ],
    dailies: [
      {
        id: 'cl_daily_1',
        title: 'Morning Meditation',
        difficulty: Difficulty.EASY,
      },
    ],
    todos: [{ title: 'Buy groceries' }],
    rewards: [{ title: 'Watch a movie', cost: 50 }],
  });

  console.log('👤 Seeding user: Bob');
  const bob = await seedUser('bob@example.com', 'bob', 'Password123!', {
    habits: [],
    dailies: [],
    todos: [],
    rewards: [],
  });

  // --- Seed User-Specific Data & Interactions ---
  console.log('📜 Seeding historical logs for Alice...');
  await seedLogs(alice.id, 'cl_habit_1', 'cl_daily_1');

  console.log('🎒 Seeding inventory for Alice...');
  const apple = items.find((i) => i.name === 'Apple');
  const topHat = items.find((i) => i.name === 'Top Hat');
  if (apple) await giveItemToUser(alice.id, apple.id, 3);
  if (topHat) await giveItemToUser(alice.id, topHat.id, 1);

  console.log("🎩 Equipping Top Hat on Alice's Pet...");
  if (topHat) {
    const alicePet = await prisma.pet.findUnique({
      where: { userId: alice.id },
    });
    if (alicePet)
      await equipItemOnPet(alicePet.id, topHat.id, EquipmentSlot.HAT);
  }

  console.log('🤝 Seeding Groups and Memberships...');
  const group = await seedGroup(
    'The Procrastinators',
    'A group for getting things done... eventually.',
    alice.id,
  );
  await joinGroup(group.id, bob.id);

  console.log('💬 Seeding Group Messages...');
  await seedGroupMessages(group.id, [
    { userId: alice.id, content: 'Hey everyone, welcome to the group!' },
    { userId: bob.id, content: 'Glad to be here!' },
  ]);

  console.log('🏆 Seeding Challenge Participations...');
  await joinChallenge(challenges[0].id, alice.id);
  await joinChallenge(challenges[1].id, bob.id);

  console.log('✅ Seeding finished successfully!');
}

// --- Seeder Functions ---

async function seedPetItems() {
  const itemsData = [
    {
      name: 'Apple',
      description: 'A crunchy, healthy fruit.',
      type: ItemType.FOOD,
      cost: 5,
      statEffect: PetStat.HUNGER,
      effectValue: 10,
      imageUrl: 'https://placehold.co/100x100/FF6347/FFFFFF.png?text=Apple',
    },
    {
      name: 'Steak',
      description: 'A hearty meal for a hungry pet.',
      type: ItemType.FOOD,
      cost: 15,
      statEffect: PetStat.HUNGER,
      effectValue: 30,
      imageUrl: 'https://placehold.co/100x100/8B4513/FFFFFF.png?text=Steak',
    },
    {
      name: 'Candy',
      description: 'A sugary treat that boosts happiness.',
      type: ItemType.TREAT,
      cost: 10,
      statEffect: PetStat.HAPPINESS,
      effectValue: 20,
      imageUrl: 'https://placehold.co/100x100/FFC0CB/000000.png?text=Candy',
    },
    {
      name: 'Top Hat',
      description: 'A very fancy top hat.',
      type: ItemType.CUSTOMIZATION,
      cost: 100,
      equipmentSlot: EquipmentSlot.HAT,
      imageUrl: 'https://placehold.co/100x100/363636/FFFFFF.png?text=Hat',
    },
    {
      name: 'Sunglasses',
      description: 'Cool shades for a cool pet.',
      type: ItemType.CUSTOMIZATION,
      cost: 75,
      equipmentSlot: EquipmentSlot.GLASSES,
      imageUrl: 'https://placehold.co/100x100/4169E1/FFFFFF.png?text=Glasses',
    },
    {
      name: 'Default Room',
      description: 'A simple, clean room for your pet.',
      type: ItemType.CUSTOMIZATION,
      cost: 0,
      equipmentSlot: EquipmentSlot.BACKGROUND,
      imageUrl: 'https://placehold.co/800x600/3a3a3a/3a3a3a.png',
    },
    {
      name: 'Sunny Meadow',
      description: 'A beautiful, sunny field for your pet to enjoy.',
      type: ItemType.CUSTOMIZATION,
      cost: 200,
      equipmentSlot: EquipmentSlot.BACKGROUND,
      imageUrl: 'https://placehold.co/800x600/87CEEB/90EE90.png',
    },
    {
      name: 'Starry Night',
      description: 'A peaceful night sky full of twinkling stars.',
      type: ItemType.CUSTOMIZATION,
      cost: 250,
      equipmentSlot: EquipmentSlot.BACKGROUND,
      imageUrl: 'https://placehold.co/800x600/00008B/FFD700.png',
    },
    {
      name: 'Cozy Library',
      description: 'A warm, quiet library with shelves of books.',
      type: ItemType.CUSTOMIZATION,
      cost: 300,
      equipmentSlot: EquipmentSlot.BACKGROUND,
      imageUrl: 'https://placehold.co/800x600/8B4513/D2B48C.png',
    },
  ];
  for (const item of itemsData) {
    await prisma.petItem.upsert({
      where: { name: item.name },
      update: {},
      create: item,
    });
  }
  return prisma.petItem.findMany();
}

async function seedChallenges() {
  const challengesData = [
    {
      title: '30-Day Fitness Challenge',
      description: 'Work out every day for 30 days.',
      goal: 'Log 30 fitness activities.',
    },
    {
      title: 'Mindful Mornings',
      description: 'Start your day with meditation.',
      goal: 'Meditate for 15 days this month.',
    },
  ];

  // Corrected Logic: Check if the challenge exists before creating it.
  for (const data of challengesData) {
    const existingChallenge = await prisma.challenge.findFirst({
      where: { title: data.title },
    });
    if (!existingChallenge) {
      await prisma.challenge.create({ data });
    }
  }
  return prisma.challenge.findMany();
}

async function seedUser(email, username, password, data) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      username,
      passwordHash: hashedPassword,
      gold: 500,
      gems: 10,
      pet: { create: { name: `${username}'s Pet` } },
      habits: { create: data.habits },
      dailies: { create: data.dailies },
      todos: { create: data.todos },
      rewards: { create: data.rewards },
    },
  });
}

async function seedLogs(userId, habitId, dailyId) {
  await prisma.habitLog.createMany({
    data: [
      { userId, habitId, completed: true, date: subDays(new Date(), 2) },
      { userId, habitId, completed: true, date: subDays(new Date(), 1) },
    ],
  });
  await prisma.dailyLog.create({
    data: {
      userId,
      dailyId,
      date: subDays(new Date(), 1),
      notes: 'A good session.',
    },
  });
}

async function giveItemToUser(userId, itemId, quantity = 1) {
  return prisma.userPetItem.create({
    data: { userId, itemId, quantity },
  });
}

async function equipItemOnPet(petId, itemId, slot) {
  return prisma.equippedItem.create({
    data: { petId, petItemId: itemId, slot },
  });
}

async function seedGroup(name, description, ownerId) {
  const group = await prisma.group.upsert({
    where: { name },
    update: {},
    create: { name, description },
  });
  await prisma.userGroup.upsert({
    where: { userId_groupId: { userId: ownerId, groupId: group.id } },
    update: {},
    create: { userId: ownerId, groupId: group.id, role: UserGroupRole.OWNER },
  });
  return group;
}

async function joinGroup(groupId, userId) {
  return prisma.userGroup.create({
    data: { userId, groupId, role: UserGroupRole.MEMBER },
  });
}

async function seedGroupMessages(groupId, messages) {
  const messagesWithGroupId = messages.map((msg) => ({ ...msg, groupId }));
  return prisma.groupMessage.createMany({
    data: messagesWithGroupId,
  });
}

async function joinChallenge(challengeId, userId) {
  return prisma.userChallenge.create({ data: { userId, challengeId } });
}

main()
  .catch((e) => {
    console.error('An error occurred during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
