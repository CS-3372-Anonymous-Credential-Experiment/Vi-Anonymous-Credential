// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

contract Groth16Verifier {
    // Scalar field size
    uint256 constant r    = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 20491192805390485299153009773594534940189261866228447918068658471970481763042;
    uint256 constant alphay  = 9383485363053290200918347156157836566562967994039712273449902621266178545958;
    uint256 constant betax1  = 4252822878758300859123897981450591353533073413197771768651442665752259397132;
    uint256 constant betax2  = 6375614351688725206403948262868962793625744043794305715222011528459656738731;
    uint256 constant betay1  = 21847035105528745403288232691147584728191162732299865338377159692350059136679;
    uint256 constant betay2  = 10505242626370262277552901082094356697409835680220590971873171140371331206856;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 1220082043926050173852998118740661788153208309304737107415604928706361481636;
    uint256 constant deltax2 = 5629335177871334674743273329384917728545760697296829541558784641167096287291;
    uint256 constant deltay1 = 4874316062989402953059274003572944667630112905562549348444154459610454560410;
    uint256 constant deltay2 = 5879328594126061070785621823132112493888843594662041911525189005033787576408;

    
    uint256 constant IC0x = 1768466091334972118962417168298067116629825138715660990184128117918487767354;
    uint256 constant IC0y = 19101139987881476304702698485601374476952131211681417761092446404420749312014;
    
    uint256 constant IC1x = 13880042611048428224616541787610816139489038948066765358308085046768648747179;
    uint256 constant IC1y = 12596213500177169810445737409508741801407746428577902629296097814150846132837;
    
    uint256 constant IC2x = 12894595645248442918463378506335646364343766356075251271902026908128923604285;
    uint256 constant IC2y = 13756599408234277663936829562394827753363627356571672684669182637942545903922;
    
    uint256 constant IC3x = 19056924940612809425592940202873681533749301772434383027358444472026120880445;
    uint256 constant IC3y = 17899016668490516807922175485725631316899023386972829169395670066009409473753;
    
    uint256 constant IC4x = 11714434836554140688565175256586275748923142939973112127733776770074781216302;
    uint256 constant IC4y = 1603897703880450844597054490013726033735203892771859966327849987878328908691;
    
    uint256 constant IC5x = 17176303886783033945413131143236692694043473022503039108002600636832919210695;
    uint256 constant IC5y = 5817827485921588552084788201388220989111735569342287054192895771502031510326;
    
    uint256 constant IC6x = 18905412125467323780783880919637701420837206739303229618609351709177117360380;
    uint256 constant IC6y = 4209927402111811272763650854184828954676929199569797681193453671256495316188;
    
    uint256 constant IC7x = 9982461054026207700232599369617080687505868851378110883723808002723074389713;
    uint256 constant IC7y = 20458129525577730613638968830103875913865991350321659964206427489572525317212;
    
    uint256 constant IC8x = 18666106501794196912540699099149045458203385844958464944797924509965195408347;
    uint256 constant IC8y = 14760020902549080862711136256040735412516598415441458969906808278914496783801;
    
    uint256 constant IC9x = 21451735183107956378793248333147923572484136827624835248243324288940838723465;
    uint256 constant IC9y = 16379784717131504305654581986222677644278032822996894672269893133770512219076;
    
    uint256 constant IC10x = 15118678169173179995113174173291931834455761750378665101825229017371794644696;
    uint256 constant IC10y = 7743727914580856068575544826772284698388953311809597202173593243091656761674;
    
    uint256 constant IC11x = 15112989274416955932929118325695351015711807315808700470697147605841553001521;
    uint256 constant IC11y = 21070722416234458403117808362693819252029923034627953154038679346123499961846;
    
    uint256 constant IC12x = 1294043504909836503100789062187069322476865975582796350222461040875082530227;
    uint256 constant IC12y = 2056165985912229967841682583241705491064029570732205096550300085803332497526;
    
    uint256 constant IC13x = 12532918432983667843739899813269394784533433600914344953017881967519342660091;
    uint256 constant IC13y = 16684936482299251422132498485479871442919881031627694525496686989338959139524;
    
    uint256 constant IC14x = 21764133832790617155238499301208539156970321599720774709642784792464798575475;
    uint256 constant IC14y = 12334342090997642613136305363418839841700474868479575365367829362186836126945;
    
    uint256 constant IC15x = 16963840668519412747067199682086800332968236959372302133770226246574906379523;
    uint256 constant IC15y = 13014567709904834752447086965785347417483601062849732101475257664725122492768;
    
    uint256 constant IC16x = 14933986655959018308837385113999021003872533415059400631964759646521029866143;
    uint256 constant IC16y = 8227541363073864659844713269110978660459881190359119371963688120188145046475;
    
    uint256 constant IC17x = 6624852475412968936906055415267736154146799993235082476310218770844146818010;
    uint256 constant IC17y = 20638897371366812229152639642039848266129118332015086814344122356344224614614;
    
    uint256 constant IC18x = 9413791983960187277227642829666477993193687794671590571351045553573376018066;
    uint256 constant IC18y = 18438255229873247578972237919626596270599676669529874182394931255101915785513;
    
    uint256 constant IC19x = 18154190530702035837337192368192185055560456924561369316344250058226632618706;
    uint256 constant IC19y = 17299456983570021577030280883750541852075857319915047861153321526928106874076;
    
    uint256 constant IC20x = 11030748529711160788665193654362643226513526247715827465206333496056138847898;
    uint256 constant IC20y = 2969688129710122796380168919466008031172717685034432570353710575842939090282;
    
    uint256 constant IC21x = 3336575533682459738643407683586157956625660139581248234188278679774697402505;
    uint256 constant IC21y = 632254211073950251907303705534197064152620766861589137381893309897519290998;
    
    uint256 constant IC22x = 9850366705798978796968152528672605494226461617783442076190508148801595088119;
    uint256 constant IC22y = 7413254212655922343324893226596360837455433469902555466973977161704256416396;
    
    uint256 constant IC23x = 8042998251806425504925858174468844291861641567936480323189424725850695733580;
    uint256 constant IC23y = 21771605662750061735114752323887119962187067791238228053487257297157580755837;
    
    uint256 constant IC24x = 1703181479342099244676170616786744921643236867034538245260869347389889749086;
    uint256 constant IC24y = 2304420153559793964537169739868675166268385108924305291168309171906431899634;
    
    uint256 constant IC25x = 6891520042251311497996947842394131704524711419615882179336989834643968910621;
    uint256 constant IC25y = 14601642289144549210946752808615714412747475740635907098959771822738801360877;
    
    uint256 constant IC26x = 16637908076298534482227002744556554285855401957645797830741670472528500159028;
    uint256 constant IC26y = 17914447683984941501531287798780766220391444060957377401623367081402151130923;
    
    uint256 constant IC27x = 7097628242464807868243439896248192311421144010805890907494589176476748882980;
    uint256 constant IC27y = 4791044587685792742916815338703611242379969514077700777852489583802430718239;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[27] calldata _pubSignals) public view returns (bool) {
        assembly {
            function checkField(v) {
                if iszero(lt(v, r)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }
            
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination vk_x
                
                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))
                
                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))
                
                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))
                
                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))
                
                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))
                
                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))
                
                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))
                
                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))
                
                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))
                
                g1_mulAccC(_pVk, IC10x, IC10y, calldataload(add(pubSignals, 288)))
                
                g1_mulAccC(_pVk, IC11x, IC11y, calldataload(add(pubSignals, 320)))
                
                g1_mulAccC(_pVk, IC12x, IC12y, calldataload(add(pubSignals, 352)))
                
                g1_mulAccC(_pVk, IC13x, IC13y, calldataload(add(pubSignals, 384)))
                
                g1_mulAccC(_pVk, IC14x, IC14y, calldataload(add(pubSignals, 416)))
                
                g1_mulAccC(_pVk, IC15x, IC15y, calldataload(add(pubSignals, 448)))
                
                g1_mulAccC(_pVk, IC16x, IC16y, calldataload(add(pubSignals, 480)))
                
                g1_mulAccC(_pVk, IC17x, IC17y, calldataload(add(pubSignals, 512)))
                
                g1_mulAccC(_pVk, IC18x, IC18y, calldataload(add(pubSignals, 544)))
                
                g1_mulAccC(_pVk, IC19x, IC19y, calldataload(add(pubSignals, 576)))
                
                g1_mulAccC(_pVk, IC20x, IC20y, calldataload(add(pubSignals, 608)))
                
                g1_mulAccC(_pVk, IC21x, IC21y, calldataload(add(pubSignals, 640)))
                
                g1_mulAccC(_pVk, IC22x, IC22y, calldataload(add(pubSignals, 672)))
                
                g1_mulAccC(_pVk, IC23x, IC23y, calldataload(add(pubSignals, 704)))
                
                g1_mulAccC(_pVk, IC24x, IC24y, calldataload(add(pubSignals, 736)))
                
                g1_mulAccC(_pVk, IC25x, IC25y, calldataload(add(pubSignals, 768)))
                
                g1_mulAccC(_pVk, IC26x, IC26y, calldataload(add(pubSignals, 800)))
                
                g1_mulAccC(_pVk, IC27x, IC27y, calldataload(add(pubSignals, 832)))
                

                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))


                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)


                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate that all evaluations ∈ F
            
            checkField(calldataload(add(_pubSignals, 0)))
            
            checkField(calldataload(add(_pubSignals, 32)))
            
            checkField(calldataload(add(_pubSignals, 64)))
            
            checkField(calldataload(add(_pubSignals, 96)))
            
            checkField(calldataload(add(_pubSignals, 128)))
            
            checkField(calldataload(add(_pubSignals, 160)))
            
            checkField(calldataload(add(_pubSignals, 192)))
            
            checkField(calldataload(add(_pubSignals, 224)))
            
            checkField(calldataload(add(_pubSignals, 256)))
            
            checkField(calldataload(add(_pubSignals, 288)))
            
            checkField(calldataload(add(_pubSignals, 320)))
            
            checkField(calldataload(add(_pubSignals, 352)))
            
            checkField(calldataload(add(_pubSignals, 384)))
            
            checkField(calldataload(add(_pubSignals, 416)))
            
            checkField(calldataload(add(_pubSignals, 448)))
            
            checkField(calldataload(add(_pubSignals, 480)))
            
            checkField(calldataload(add(_pubSignals, 512)))
            
            checkField(calldataload(add(_pubSignals, 544)))
            
            checkField(calldataload(add(_pubSignals, 576)))
            
            checkField(calldataload(add(_pubSignals, 608)))
            
            checkField(calldataload(add(_pubSignals, 640)))
            
            checkField(calldataload(add(_pubSignals, 672)))
            
            checkField(calldataload(add(_pubSignals, 704)))
            
            checkField(calldataload(add(_pubSignals, 736)))
            
            checkField(calldataload(add(_pubSignals, 768)))
            
            checkField(calldataload(add(_pubSignals, 800)))
            
            checkField(calldataload(add(_pubSignals, 832)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
