import { useState } from 'react';
import { Alchemy, Network } from 'alchemy-sdk';
import {
  Box,
  Button,
  Input,
  VStack,
  HStack,
  Text,
  Image,
  Card,
  CardBody,
  Heading,
  Spinner,
  Alert,
  AlertIcon,
  Container,
  SimpleGrid,
  Flex,
  Badge,
  useToast,
  AspectRatio,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  StatHelpText,
  Tooltip,
  IconButton,
  Icon,
} from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { DownloadIcon, SearchIcon, ViewIcon } from '@chakra-ui/icons';

const MotionBox = motion(Box);
const MotionSimpleGrid = motion(SimpleGrid);

function App() {
  const [wallet, setWallet] = useState('');
  const [tokens, setTokens] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);
  
  const { address, isConnected } = useAccount();
  const toast = useToast();

  const alchemy = new Alchemy({
    apiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET,
  });

  async function resolveAddressOrENS(input) {
    if (input.endsWith('.eth')) {
      try {
        const resolved = await alchemy.core.resolveName(input);
        if (resolved) {
          toast({
            title: 'ENS Resolved!',
            description: `${input} → ${resolved.slice(0, 6)}...${resolved.slice(-4)}`,
            status: 'info',
            duration: 2000,
            isClosable: true,
          });
          return resolved;
        }
      } catch (err) {
        toast({
          title: 'ENS Failed',
          description: 'Could not resolve ENS name',
          status: 'error',
          duration: 2000,
        });
        return null;
      }
    }
    return input;
  }

  async function fetchDashboardData(addressToQuery) {
    const targetAddress = addressToQuery || wallet;
    
    if (!targetAddress) {
      toast({
        title: 'No Input',
        description: 'Please enter an address or connect wallet',
        status: 'warning',
        variant: 'subtle',
        duration: 2000,
      });
      return;
    }

    setLoading(true);
    setTokens([]);
    setNfts([]);

    try {
      const resolvedAddress = await resolveAddressOrENS(targetAddress);
      if (!resolvedAddress) {
        setLoading(false);
        return;
      }

      if (!/^0x[a-fA-F0-9]{40}$/.test(resolvedAddress)) {
        throw new Error('Invalid Ethereum address format');
      }

      const [tokenData, nftsData] = await Promise.all([
        alchemy.core.getTokenBalances(resolvedAddress),
        alchemy.nft.getNftsForOwner(resolvedAddress)
      ]);

      const nonZeroTokens = tokenData.tokenBalances.filter(t => t.tokenBalance !== '0' && t.tokenBalance !== '0x0');
      const tokensWithMetadata = await Promise.all(
        nonZeroTokens.map(async (token) => {
          try {
            const metadata = await alchemy.core.getTokenMetadata(token.contractAddress);
            const balance = parseInt(token.tokenBalance) / Math.pow(10, metadata.decimals || 18);
            return {
              name: metadata.name || 'Unknown',
              symbol: metadata.symbol || '???',
              logo: metadata.logo,
              balance: balance.toFixed(4),
              contractAddress: token.contractAddress,
              decimals: metadata.decimals,
            };
          } catch { return null; }
        })
      );

      const formattedNfts = nftsData.ownedNfts.map(nft => ({
        title: nft.title || 'Untitled',
        contractAddress: nft.contract.address,
        tokenId: nft.tokenId,
        tokenType: nft.tokenType,
        image: nft.media?.[0]?.gateway || nft.media?.[0]?.raw || null,
        collectionName: nft.contract.name || 'Unknown Collection',
      }));

      setTokens(tokensWithMetadata.filter(t => t !== null));
      setNfts(formattedNfts);
      setHasQueried(true);

      toast({
        title: 'Sync Complete',
        description: `Retrieved ${tokensWithMetadata.length} tokens and ${formattedNfts.length} NFTs`,
        status: 'success',
        duration: 3000,
      });

    } catch (err) {
      toast({
        title: 'Query Error',
        description: err.message,
        status: 'error',
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  }

  const exportToCSV = () => {
    if (tokens.length === 0) return;
    const headers = ['Name', 'Symbol', 'Balance', 'Contract Address'];
    const rows = tokens.map(t => [t.name, t.symbol, t.balance, t.contractAddress]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tokens_${wallet || address}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box minH="100vh" bg="gray.900" color="white" py={10}>
      <Container maxW="container.xl">
        <VStack spacing={12} align="stretch">
          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <VStack align="start" spacing={0}>
              <Heading 
                size="2xl" 
               bgColor="blue.500"
                bgClip="text"
                letterSpacing="tight"
                fontWeight="extrabold"
              >
                AetherView
              </Heading>
              <Text color="gray.400" fontSize="md">Unified Web3 Portfolio Dashboard</Text>
            </VStack>
            <ConnectButton />
          </Flex>

          <Box 
            p={8} 
            bg="whiteAlpha.50" 
            backdropFilter="blur(20px)" 
            borderRadius="3xl" 
            border="1px solid" 
            borderColor="whiteAlpha.100"
            shadow="2xl"
          >
            <VStack spacing={6}>
              <HStack width="100%" spacing={4}>
                <Input
                  placeholder="Enter Address or ENS (e.g., vitalik.eth)"
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                  size="lg"
                  variant="filled"
                  bg="whiteAlpha.100"
                  _hover={{ bg: 'whiteAlpha.200' }}
                  _focus={{ bg: 'whiteAlpha.200', borderColor: 'cyan.400' }}
                  height="60px"
                  borderRadius="2xl"
                  onKeyPress={(e) => e.key === 'Enter' && fetchDashboardData()}
                />
                <IconButton
                  aria-label="Search"
                  icon={<SearchIcon />}
                  colorScheme="cyan"
                  size="lg"
                  height="60px"
                  width="60px"
                  borderRadius="2xl"
                  onClick={() => fetchDashboardData()}
                  isLoading={loading}
                />
              </HStack>
              
              {isConnected && !hasQueried && (
                <Button
                  leftIcon={<ViewIcon />}
                  variant="ghost"
                  colorScheme="pink"
                  onClick={() => {
                    setWallet(address);
                    fetchDashboardData(address);
                  }}
                >
                  Quick Scan My Wallet
                </Button>
              )}
            </VStack>
          </Box>

          <AnimatePresence>
            {hasQueried && !loading && (
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <StatGroup bg="whiteAlpha.50" p={6} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100" mb={10}>
                  <Stat>
                    <StatLabel color="gray.400">Total Tokens</StatLabel>
                    <StatNumber fontSize="3xl" color="cyan.300">{tokens.length}</StatNumber>
                    <StatHelpText>Unique ERC-20s</StatHelpText>
                  </Stat>
                  <Stat>
                    <StatLabel color="gray.400">NFT Assets</StatLabel>
                    <StatNumber fontSize="3xl" color="purple.300">{nfts.length}</StatNumber>
                    <StatHelpText>Collected Items</StatHelpText>
                  </Stat> STATS
                </StatGroup>

                <Tabs variant="soft-rounded" colorScheme="cyan">
                  <TabList mb={8} bg="whiteAlpha.100" p={1} borderRadius="xl" width="fit-content">
                    <Tab borderRadius="lg" _selected={{ bg: 'cyan.400', color: 'gray.900' }}> Tokens</Tab>
                    <Tab borderRadius="lg" _selected={{ bg: 'purple.400', color: 'white' }}>NFTs</Tab>
                  </TabList>

                  <TabPanels>
                    <TabPanel p={0}>
                      <Flex justify="space-between" align="center" mb={6}>
                        <Heading size="md" color="gray.300">Portfolio Assets</Heading>
                        <Button 
                          leftIcon={<DownloadIcon />} 
                          variant="outline" 
                          size="sm" 
                          onClick={exportToCSV}
                          borderColor="cyan.500"
                          color="cyan.200"
                          _hover={{ bg: 'cyan.900' }}
                        >
                          Export CSV
                        </Button>
                      </Flex>
                      <MotionSimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                        {tokens.map((token, i) => (
                          <Card 
                            key={i} 
                            bg="whiteAlpha.50" 
                            border="1px solid" 
                            borderColor="whiteAlpha.100"
                            _hover={{ transform: 'translateY(-5px)', bg: 'whiteAlpha.100', borderColor: 'cyan.400' }}
                            transition="all 0.3s"
                            borderRadius="2xl"
                          >
                            <CardBody>
                              <HStack spacing={4}>
                                {token.logo ? (
                                  <Image src={token.logo} boxSize="45px" borderRadius="full" />
                                ) : (
                                  <Box boxSize="45px" bg="cyan.900" borderRadius="full" display="flex" align="center" justify="center">
                                    <Text fontWeight="bold" color="cyan.200">{token.symbol[0]}</Text>
                                  </Box>
                                )}
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="bold" fontSize="lg" color=" blue.500">{token.symbol}</Text>
                                  <Text fontSize="sm" color="blue.500" isTruncated maxW="150px">{token.name}</Text>
                                  <Text fontSize="xl" color="cyan.400" fontWeight="bold">{token.balance}</Text>
                                </VStack>
                              </HStack>
                            </CardBody>
                          </Card>
                        ))}
                      </MotionSimpleGrid>
                    </TabPanel>

                    <TabPanel p={0}>
                      <Heading size="md" color="gray.300" mb={6}>Digital Collectibles</Heading>
                      <MotionSimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
                        {nfts.map((nft, i) => (
                          <Card 
                            key={i} 
                            bg="whiteAlpha.50" 
                            border="1px solid" 
                            borderColor="whiteAlpha.100"
                            borderRadius="2xl"
                            overflow="hidden"
                            _hover={{ transform: 'scale(1.02)', borderColor: 'purple.400' }}
                            transition="all 0.3s"
                            cursor="pointer"
                            onClick={() => window.open(`https://opensea.io/assets/ethereum/${nft.contractAddress}/${nft.tokenId}`, '_blank')}
                          >
                            <AspectRatio ratio={1}>
                              <Box bg="gray.800">
                                {nft.image ? (
                                  <Image src={nft.image} objectFit="cover" />
                                ) : (
                                  <Flex align="center" justify="center" h="100%"><Icon as={ViewIcon} boxSize={10} color="whiteAlpha.200" /></Flex>
                                )}
                              </Box>
                            </AspectRatio>
                            <CardBody p={4}>
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="bold" noOfLines={1} fontSize="sm">{nft.title}</Text>
                                <Text color="gray.500" fontSize="xs" noOfLines={1}>{nft.collectionName}</Text>
                                <Badge colorScheme="purple" variant="subtle" fontSize="10px">ID: #{nft.tokenId.slice(0, 8)}</Badge>
                              </VStack>
                            </CardBody>
                          </Card>
                        ))}
                      </MotionSimpleGrid>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </MotionBox>
            )}
          </AnimatePresence>

          {loading && (
            <Flex justify="center" py={20}>
              <VStack spacing={4}>
                <Spinner size="xl" color="cyan.400" thickness="4px" />
                <Text color="gray.400" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}>Indexing the Aethers...</Text>
              </VStack>
            </Flex>
          )}

          {!hasQueried && !loading && (
             <Flex justify="center" py={20} border="1px dashed" borderColor="whiteAlpha.200" borderRadius="3xl">
                <VStack spacing={2} color="gray.500">
                  <Text fontSize="lg">Enter a wallet address to begin exploration</Text>
                  <Text fontSize="sm">AetherView will sync tokens and NFTs in seconds</Text>
                </VStack>
             </Flex>
          )}
        </VStack>
      </Container>
    </Box>
  );
}

export default App;
