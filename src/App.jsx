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
} from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

function App() {
  const [wallet, setWallet] = useState('');
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
            status: 'success',
            duration: 2000,
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

  async function getNFTs(addressToQuery) {
    const targetAddress = addressToQuery || wallet;
    
    if (!targetAddress) {
      toast({
        title: 'No Address',
        description: 'Please enter an address or connect wallet',
        status: 'warning',
        duration: 2000,
      });
      return;
    }

    setLoading(true);
    setNfts([]);

    try {
      const resolvedAddress = await resolveAddressOrENS(targetAddress);
      if (!resolvedAddress) {
        setLoading(false);
        return;
      }

      if (!/^0x[a-fA-F0-9]{40}$/.test(resolvedAddress)) {
        throw new Error('Invalid address format');
      }

      const nftsData = await alchemy.nft.getNftsForOwner(resolvedAddress);

      const formattedNfts = nftsData.ownedNfts.map(nft => ({
        title: nft.title || 'Untitled',
        contractAddress: nft.contract.address,
        tokenId: nft.tokenId,
        tokenType: nft.tokenType,
        description: nft.description || 'No description',
        image: nft.media?.[0]?.gateway || nft.media?.[0]?.raw || null,
        collectionName: nft.contract.name || 'Unknown Collection',
        floorPrice: nft.contract.openSea?.floorPrice || null,
      }));

      setNfts(formattedNfts);
      setHasQueried(true);

      toast({
        title: 'Success!',
        description: `Found ${formattedNfts.length} NFTs`,
        status: 'success',
        duration: 2000,
      });

    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch NFTs',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }

  function checkMyWallet() {
    if (isConnected && address) {
      setWallet(address);
      getNFTs(address);
    } else {
      toast({
        title: 'Not Connected',
        description: 'Please connect your wallet first',
        status: 'warning',
        duration: 2000,
      });
    }
  }

  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing={8}>
        <Heading 
          size="2xl"
         bgColor={'blue.400'}
          
          bgClip="text"
        >
           NFT Gallery
        </Heading>
        <Text fontSize="lg" color="gray.600" textAlign="center">
          View any wallet's NFT collection instantly!
        </Text>

        <ConnectButton />

        <VStack width="100%" spacing={4}>
          <HStack width="100%">
            <Input
              placeholder="Enter wallet address or ENS (vitalik.eth)"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              size="lg"
              onKeyPress={(e) => {
                if (e.key === 'Enter') getNFTs();
              }}
            />
            <Button
            bgColor={'blue.200'}
              size="lg"
              onClick={() => getNFTs()}
              isLoading={loading}
              loadingText="Loading..."
            >
              Search
            </Button>
          </HStack>

          {isConnected && (
            <Button
              colorScheme="pink"
              size="md"
              onClick={checkMyWallet}
              width="100%"
            >
              🔍 Show My NFTs
            </Button>
          )}
        </VStack>

        {loading && (
          <VStack py={10}>
            <Spinner size="xl" color="purple.500" thickness="4px" />
            <Text fontSize="lg">Fetching NFTs...</Text>
            <Text fontSize="sm" color="gray.500">
              This might take a few seconds
            </Text>
          </VStack>
        )}

        {hasQueried && !loading && (
          <Box width="100%">
            <Flex justify="space-between" align="center" mb={6}>
              <Heading size="lg">
                {nfts.length > 0 ? `Found ${nfts.length} NFTs` : 'No NFTs Found'}
              </Heading>
              {nfts.length > 0 && (
                <Badge colorScheme="purple" fontSize="md" p={2}>
                  Total: {nfts.length}
                </Badge>
              )}
            </Flex>

            {nfts.length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                This wallet doesn't own any NFTs yet!
              </Alert>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
                {nfts.map((nft, index) => (
                  <Card
                    key={index}
                    overflow="hidden"
                    _hover={{
                      transform: 'translateY(-8px)',
                      shadow: '2xl',
                      transition: 'all 0.3s',
                    }}
                    cursor="pointer"
                    onClick={() => {
                      window.open(
                        `https://opensea.io/assets/ethereum/${nft.contractAddress}/${nft.tokenId}`,
                        '_blank'
                      );
                    }}
                  >
                    <AspectRatio ratio={1}>
                      <Box bg="gray.100">
                        {nft.image ? (
                          <Image
                            src={nft.image}
                            alt={nft.title}
                            objectFit="cover"
                            width="100%"
                            height="100%"
                            fallback={
                              <Flex
                                width="100%"
                                height="100%"
                                bg="gray.200"
                                align="center"
                                justify="center"
                              >
                                <Text color="gray.500">No Image</Text>
                              </Flex>
                            }
                          />
                        ) : (
                          <Flex
                            width="100%"
                            height="100%"
                            bgGradient="linear(to-br, purple.400, pink.400)"
                            align="center"
                            justify="center"
                          >
                            <Text fontSize="4xl">🖼️</Text>
                          </Flex>
                        )}
                      </Box>
                    </AspectRatio>

                    <CardBody>
                      <VStack align="start" spacing={2}>
                        <Text
                          fontWeight="bold"
                          fontSize="md"
                          noOfLines={1}
                        >
                          {nft.title}
                        </Text>
                        <Text fontSize="xs" color="gray.400" isTruncated>
  Addr: {nft.contractAddress}
</Text>
                        <Text
                          fontSize="sm"
                          color="gray.600"
                          noOfLines={1}
                        >
                          {nft.collectionName}
                        </Text>

                        <HStack>
                          <Badge colorScheme="purple">
                            {nft.tokenType}
                          </Badge>
                          <Badge colorScheme="pink">
                            #{nft.tokenId}
                          </Badge>
                        </HStack>

                        {nft.floorPrice && (
                          <Text fontSize="xs" color="green.500">
                            Floor: {nft.floorPrice} ETH
                          </Text>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Box>
        )}

        <Text fontSize="sm" color="gray.500" textAlign="center" pt={10}>
          💡 Click any NFT to view on OpenSea
          <br />
          Supports ENS names like "vitalik.eth"
        </Text>
      </VStack>
    </Container>
  );
}

export default App;
