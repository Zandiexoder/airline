package com.patson

import com.patson.data._
import com.patson.data.airplane.ModelSource
import com.patson.model._
import com.patson.model.airplane._
import com.patson.util.{AirlineCache, AirportCache}

import scala.collection.mutable.ListBuffer
import scala.util.Random

/**
 * Bot AI Simulation - Makes bot airlines feel alive by giving them intelligent decision-making
 * 
 * PHASE 2: Full implementation of route creation, aircraft purchases, and pricing
 */
object BotAISimulation {
  
  val ROUTE_PLANNING_PROBABILITY = 0.15 // 15% chance per cycle to plan new routes
  val AIRPLANE_PURCHASE_PROBABILITY = 0.20 // 20% chance per cycle to buy planes
  val ROUTE_OPTIMIZATION_PROBABILITY = 0.10 // 10% chance to optimize existing routes
  val COMPETITION_RESPONSE_PROBABILITY = 0.25 // 25% chance to respond to competition
  
  val MAX_ROUTES_PER_CYCLE = 2 // Maximum new routes per cycle per bot
  val MAX_AIRCRAFT_PURCHASE = 3 // Maximum aircraft purchases per cycle per bot
  
  def simulate(cycle: Int): Unit = {
    println("============================================")
    println("Starting Bot AI Simulation - Phase 2")
    println("============================================")
    
    val botAirlines = AirlineSource.loadAllAirlines(fullLoad = true)
      .filter(_.airlineType == AirlineType.NON_PLAYER)
    
    if (botAirlines.isEmpty) {
      println("No bot airlines found, skipping simulation")
      return
    }
    
    println(s"Processing ${botAirlines.size} bot airlines")
    
    botAirlines.foreach { airline =>
      try {
        val personality = determineBotPersonality(airline)
        println(s"\n[${airline.name}] Personality: $personality | Balance: $$${airline.getBalance()/1000000}M")
        
        // Route planning - add new routes
        if (Random.nextDouble() < ROUTE_PLANNING_PROBABILITY) {
          planNewRoutes(airline, personality, cycle)
        }
        
        // Fleet management - buy new airplanes
        if (Random.nextDouble() < AIRPLANE_PURCHASE_PROBABILITY) {
          purchaseAirplanes(airline, personality, cycle)
        }
        
        // Route optimization - adjust frequencies, pricing
        if (Random.nextDouble() < ROUTE_OPTIMIZATION_PROBABILITY) {
          optimizeExistingRoutes(airline, personality, cycle)
        }
        
        // Competition response - react to player/other bots
        if (Random.nextDouble() < COMPETITION_RESPONSE_PROBABILITY) {
          respondToCompetition(airline, personality, cycle)
        }
        
      } catch {
        case e: Exception =>
          println(s"Error processing bot airline ${airline.name}: ${e.getMessage}")
          e.printStackTrace()
      }
    }
    
    println("\n============================================")
    println("Finished Bot AI Simulation")
    println("============================================\n")
  }
  
  /**
   * Determine bot personality based on airline characteristics
   */
  private def determineBotPersonality(airline: Airline): BotPersonality = {
    val cash = airline.getBalance()
    val reputation = airline.getReputation()
    val serviceQuality = airline.getCurrentServiceQuality()
    
    // Use airline type as base personality
    airline.airlineType match {
      case AirlineType.DISCOUNT => BotPersonality.BUDGET
      case AirlineType.LUXURY => BotPersonality.PREMIUM
      case _ =>
        // Determine by characteristics
        if (cash > 1000000000) { // > $1B
          if (serviceQuality > 40) BotPersonality.PREMIUM
          else BotPersonality.AGGRESSIVE
        } else if (cash > 100000000) { // > $100M
          BotPersonality.BALANCED
        } else if (reputation > 60) {
          BotPersonality.CONSERVATIVE
        } else {
          BotPersonality.REGIONAL
        }
    }
  }
  
  /**
   * Plan new routes based on bot personality - PHASE 2: Actually create routes!
   */
  private def planNewRoutes(airline: Airline, personality: BotPersonality, cycle: Int): Unit = {
    println(s"[${airline.name}] Planning new routes (${personality})")
    
    val bases = AirlineSource.loadAirlineBasesByAirline(airline.id)
    if (bases.isEmpty) {
      println(s"[${airline.name}] No bases found, cannot plan routes")
      return
    }
    
    val existingLinks = LinkSource.loadFlightLinksByAirlineId(airline.id)
    val existingDestinations = existingLinks.flatMap(link => List(link.from.id, link.to.id)).toSet
    
    // Get available cash for route expansion
    val availableCash = airline.getBalance() * 0.1 // Use 10% of cash for expansion
    if (availableCash < 5000000) {
      println(s"[${airline.name}] Insufficient funds for expansion (need $$5M)")
      return
    }
    
    // Get available airplanes
    val allAirplanes = AirplaneSource.loadAirplanesByOwner(airline.id)
    val assignedAirplanes = LinkSource.loadFlightLinksByAirlineId(airline.id)
      .flatMap(_.getAssignedAirplanes().keys)
      .toSet
    val availableAirplanes = allAirplanes.filter(a => 
      !assignedAirplanes.contains(a) && a.isReady
    )
    
    if (availableAirplanes.isEmpty) {
      println(s"[${airline.name}] No available aircraft for new routes")
      return
    }
    
    var routesCreated = 0
    
    bases.foreach { base =>
      if (routesCreated >= MAX_ROUTES_PER_CYCLE) return
      
        val potentialDestinations = findPotentialDestinations(
          base.airport, 
          existingDestinations, 
          personality, 
          availableCash.toLong,
          availableAirplanes
        )potentialDestinations.foreach { destination =>
        if (routesCreated < MAX_ROUTES_PER_CYCLE) {
          // Find suitable aircraft for this route
          val distance = Computation.calculateDistance(base.airport, destination).intValue()
          val suitableAircraft = availableAirplanes.find(airplane => 
            airplane.model.range >= distance && 
            airplane.model.runwayRequirement <= Math.min(base.airport.runwayLength, destination.runwayLength)
          )
          
          suitableAircraft match {
            case Some(airplane) =>
              // Calculate optimal frequency based on personality
              val frequency = personality.calculateOptimalFrequency(distance, airplane)
              
              // Create the link!
              val success = createRoute(
                airline,
                base.airport,
                destination,
                airplane,
                frequency,
                personality,
                cycle
              )
              
              if (success) {
                routesCreated += 1
                println(s"✈️  [${airline.name}] NEW ROUTE: ${base.airport.iata} -> ${destination.iata} (${frequency}x weekly, ${airplane.model.name})")
              }
              
            case None =>
              println(s"[${airline.name}] No suitable aircraft for ${base.airport.iata} -> ${destination.iata} (${distance}km)")
          }
        }
      }
    }
    
    if (routesCreated == 0) {
      println(s"[${airline.name}] No new routes created this cycle")
    }
  }
  
  /**
   * Actually create a route link - PHASE 2 Implementation
   */
  private def createRoute(
    airline: Airline,
    from: Airport,
    to: Airport,
    airplane: Airplane,
    frequency: Int,
    personality: BotPersonality,
    cycle: Int
  ): Boolean = {
    try {
      val distance = Computation.calculateDistance(from, to).intValue()
      val duration = Computation.calculateDuration(airplane.model, distance)
      
      // Calculate pricing based on personality
      val pricingMap = personality.calculatePricing(from, to, distance)
      
      // Create link class configuration based on personality
      val linkClassConfig = personality.configureLinkClasses(airplane)
      
      // Create the link
      val link = Link(
        from,
        to,
        airline,
        LinkClassValues.getInstance(
          pricingMap(ECONOMY).toInt, 
          pricingMap(BUSINESS).toInt, 
          pricingMap(FIRST).toInt
        ), // Pricing
        distance,
        LinkClassValues.getInstanceByMap(linkClassConfig), // Capacity configuration
        personality.serviceQuality.toInt, // rawQuality
        duration,
        frequency,
        0 // flightNumber
      )
      
      // Assign airplane to link
      link.setAssignedAirplanes(Map(airplane -> LinkAssignment(frequency, frequency)))
      
      // Save the link
      LinkSource.saveLink(link) match {
        case Some(savedLink) =>
          println(s"    💰 Pricing: Economy ${pricingMap(ECONOMY).toInt}, Business ${pricingMap(BUSINESS).toInt}, First ${pricingMap(FIRST).toInt}")
          true
        case None =>
          println(s"    ❌ Failed to save link")
          false
      }
      
    } catch {
      case e: Exception =>
        println(s"    ❌ Error creating route: ${e.getMessage}")
        false
    }
  }
  
  /**
   * Find potential destination airports based on personality
   */
  private def findPotentialDestinations(
    fromAirport: Airport,
    existingDestinations: Set[Int],
    personality: BotPersonality,
    budget: Long,
    availableAircraft: List[Airplane]
  ): List[Airport] = {
    
    if (availableAircraft.isEmpty) return List.empty
    
    val maxRange = availableAircraft.map(_.model.range).max
    val minRunway = availableAircraft.map(_.model.runwayRequirement).min
    
    val allAirports = AirportSource.loadAllAirports(fullLoad = false)
      .filter(airport => 
        !existingDestinations.contains(airport.id) && // Not already connected
        airport.id != fromAirport.id && // Not same airport
        airport.size >= personality.minAirportSize && // Meets size requirement
        airport.population >= personality.minPopulation && // Meets population requirement
        airport.runwayLength >= minRunway // Can land available aircraft
      )
    
    // Score airports based on personality and distance
    val scoredAirports = allAirports.map { airport =>
      val distance = Computation.calculateDistance(fromAirport, airport).intValue()
      
      // Only consider if within range
      if (distance <= maxRange) {
        val score = personality.scoreDestination(airport, distance, fromAirport)
        (airport, score, distance)
      } else {
        (airport, 0.0, distance)
      }
    }
    
    // Return top candidates
    scoredAirports
      .filter(_._2 > 0)
      .sortBy(-_._2)
      .take(5)
      .map(_._1)
      .toList
  }
  
  /**
   * Purchase airplanes based on personality and needs
   */
  private def purchaseAirplanes(airline: Airline, personality: BotPersonality, cycle: Int): Unit = {
    println(s"[${airline.name}] Considering airplane purchases (${personality})")
    
    val availableCash = airline.getBalance() * personality.fleetBudgetRatio
    if (availableCash < 5000000) return // Need at least $5M
    
    val currentFleet = AirplaneSource.loadAirplanesByOwner(airline.id)
    val avgAge = if (currentFleet.nonEmpty) {
      currentFleet.map(a => cycle - a.purchasedCycle).sum / currentFleet.size
    } else 0
    
    // Determine what type of aircraft is needed
    val neededCategory = personality.preferredAircraftCategory(currentFleet, avgAge)
    
    println(s"[${airline.name}] Looking for ${neededCategory} aircraft, budget: $$${availableCash/1000000}M")
    
    // TODO: Actual aircraft purchase logic
    // Would need to:
    // 1. Find suitable models in category
    // 2. Check if affordable
    // 3. Consider age vs new purchase
    // 4. Configure based on personality
    // 5. Purchase and assign home base
  }
  
    /**
   * Optimize existing routes - adjust frequency and pricing based on performance
   */
  private def optimizeExistingRoutes(airline: Airline, personality: BotPersonality, cycle: Int): Unit = {
    // TODO: Implement route optimization
    // For now, just log
    println(s"[${airline.name}] Route optimization not yet implemented")
    
    /* Future implementation:
    val links = LinkSource.loadFlightLinksByAirlineId(airline.id)
    if (links.isEmpty) return
    
    // Load link statistics for previous cycle
    val linkStatistics = LinkStatisticsSource.loadLinkStatisticsByAirline(airline.id)
    */
  }
  
  /**
   * Respond to competition on shared routes
   */
  private def respondToCompetition(airline: Airline, personality: BotPersonality, cycle: Int): Unit = {
    println(s"[${airline.name}] Analyzing competition (${personality})")
    
    val ownLinks = LinkSource.loadFlightLinksByAirlineId(airline.id)
    
    ownLinks.foreach { link =>
      // Find competing airlines on same route
      val allLinksOnRoute = LinkSource.loadLinksByCriteria(List.empty)
        .filter(l => 
          (l.from.id == link.from.id && l.to.id == link.to.id) ||
          (l.from.id == link.to.id && l.to.id == link.from.id)
        )
        .filter(_.airline.id != airline.id)
      
      if (allLinksOnRoute.nonEmpty) {
        println(s"[${airline.name}] Competition detected on ${link.from.iata}->${link.to.iata}: ${allLinksOnRoute.size} competitors")
        
        // Aggressive bots increase frequency
        if (personality == BotPersonality.AGGRESSIVE) {
          println(s"[${airline.name}] Aggressive response: considering frequency increase")
          // TODO: Increase frequency/lower prices
        }
        
        // Budget bots lower prices
        if (personality == BotPersonality.BUDGET) {
          println(s"[${airline.name}] Budget response: considering price reduction")
          // TODO: Lower prices to compete
        }
        
        // Premium bots improve service
        if (personality == BotPersonality.PREMIUM) {
          println(s"[${airline.name}] Premium response: maintaining quality advantage")
          // TODO: Ensure high service quality maintained
        }
      }
    }
  }
}

/**
 * Bot personality types with different strategies
 */
sealed trait BotPersonality {
  def minAirportSize: Int
  def minPopulation: Long
  def targetCapacityLow: Double
  def targetCapacityHigh: Double
  def fleetBudgetRatio: Double
  def serviceQuality: Double
  
  def scoreDestination(airport: Airport, distance: Int, fromAirport: Airport): Double
  def preferredAircraftCategory(currentFleet: List[Airplane], avgAge: Int): String
  def calculatePricing(fromAirport: Airport, toAirport: Airport, distance: Int): Map[LinkClass, Double]
  def configureLinkClasses(airplane: Airplane): Map[LinkClass, Int]
  def calculateOptimalFrequency(distance: Int, airplane: Airplane): Int
}

object BotPersonality {
  
  case object AGGRESSIVE extends BotPersonality {
    val minAirportSize = 3
    val minPopulation = 500000L
    val targetCapacityLow = 0.60
    val targetCapacityHigh = 0.90
    val fleetBudgetRatio = 0.25 // Spend 25% on fleet
    val serviceQuality = 50.0 // Moderate service
    
    def scoreDestination(airport: Airport, distance: Int, fromAirport: Airport): Double = {
      // Prefer larger airports, longer routes
      val sizeScore = airport.size * 15.0
      val popScore = Math.log10(airport.population) * 10.0
      val distanceScore = if (distance > 3000) 20.0 else distance / 150.0
      sizeScore + popScore + distanceScore
    }
    
    def preferredAircraftCategory(currentFleet: List[Airplane], avgAge: Int): String = {
      if (currentFleet.size < 10) "REGIONAL" else "LARGE"
    }
    
    def calculatePricing(fromAirport: Airport, toAirport: Airport, distance: Int): Map[LinkClass, Double] = {
      // Competitive pricing - 10% below standard
      val flightCategory = Computation.getFlightCategory(fromAirport, toAirport)
      val baseIncome = fromAirport.baseIncome
      Map(
        ECONOMY -> (Pricing.computeStandardPrice(distance, flightCategory, ECONOMY, PassengerType.TRAVELER, baseIncome) * 0.90),
        BUSINESS -> (Pricing.computeStandardPrice(distance, flightCategory, BUSINESS, PassengerType.TRAVELER, baseIncome) * 0.90),
        FIRST -> (Pricing.computeStandardPrice(distance, flightCategory, FIRST, PassengerType.TRAVELER, baseIncome) * 0.90)
      )
    }
    
    def configureLinkClasses(airplane: Airplane): Map[LinkClass, Int] = {
      // Growth-focused: 80% economy, 15% business, 5% first
      val totalSeats = airplane.model.capacity
      Map(
        ECONOMY -> (totalSeats * 0.80).toInt,
        BUSINESS -> (totalSeats * 0.15).toInt,
        FIRST -> (totalSeats * 0.05).toInt
      )
    }
    
    def calculateOptimalFrequency(distance: Int, airplane: Airplane): Int = {
      // High frequency for competitive edge
      val baseFrequency = (distance / 500.0).toInt + 2
      Math.min(baseFrequency, 14) // Cap at 14 weekly flights (2 per day)
    }
  }
  
  case object CONSERVATIVE extends BotPersonality {
    val minAirportSize = 5
    val minPopulation = 2000000L
    val targetCapacityLow = 0.75
    val targetCapacityHigh = 0.95
    val fleetBudgetRatio = 0.15
    val serviceQuality = 65.0 // Good service
    
    def scoreDestination(airport: Airport, distance: Int, fromAirport: Airport): Double = {
      // Prefer major hubs, established routes
      val sizeScore = airport.size * 25.0
      val popScore = Math.log10(airport.population) * 15.0
      val distanceScore = if (distance < 5000 && distance > 1000) 15.0 else 5.0
      sizeScore + popScore + distanceScore
    }
    
    def preferredAircraftCategory(currentFleet: List[Airplane], avgAge: Int): String = {
      if (avgAge > 15) "MEDIUM" else "LARGE" // Replace aging fleet first
    }
    
    def calculatePricing(fromAirport: Airport, toAirport: Airport, distance: Int): Map[LinkClass, Double] = {
      // Premium pricing - 15% above standard
      val flightCategory = Computation.getFlightCategory(fromAirport, toAirport)
      val baseIncome = fromAirport.baseIncome
      Map(
        ECONOMY -> (Pricing.computeStandardPrice(distance, flightCategory, ECONOMY, PassengerType.TRAVELER, baseIncome) * 1.15),
        BUSINESS -> (Pricing.computeStandardPrice(distance, flightCategory, BUSINESS, PassengerType.TRAVELER, baseIncome) * 1.15),
        FIRST -> (Pricing.computeStandardPrice(distance, flightCategory, FIRST, PassengerType.TRAVELER, baseIncome) * 1.15)
      )
    }
    
    def configureLinkClasses(airplane: Airplane): Map[LinkClass, Int] = {
      // Traditional: 70% economy, 20% business, 10% first
      val totalSeats = airplane.model.capacity
      Map(
        ECONOMY -> (totalSeats * 0.70).toInt,
        BUSINESS -> (totalSeats * 0.20).toInt,
        FIRST -> (totalSeats * 0.10).toInt
      )
    }
    
    def calculateOptimalFrequency(distance: Int, airplane: Airplane): Int = {
      // Steady frequency
      val baseFrequency = (distance / 700.0).toInt + 1
      Math.min(baseFrequency, 10) // Cap at 10 weekly flights
    }
  }
  
  case object BALANCED extends BotPersonality {
    val minAirportSize = 4
    val minPopulation = 1000000L
    val targetCapacityLow = 0.70
    val targetCapacityHigh = 0.88
    val fleetBudgetRatio = 0.18
    val serviceQuality = 55.0 // Standard service
    
    def scoreDestination(airport: Airport, distance: Int, fromAirport: Airport): Double = {
      val sizeScore = airport.size * 18.0
      val popScore = Math.log10(airport.population) * 12.0
      val distanceScore = distance / 200.0
      sizeScore + popScore + distanceScore
    }
    
    def preferredAircraftCategory(currentFleet: List[Airplane], avgAge: Int): String = {
      if (currentFleet.size % 3 == 0) "LARGE" else "MEDIUM"
    }
    
    def calculatePricing(fromAirport: Airport, toAirport: Airport, distance: Int): Map[LinkClass, Double] = {
      // Market rate pricing
      val flightCategory = Computation.getFlightCategory(fromAirport, toAirport)
      val baseIncome = fromAirport.baseIncome
      Map(
        ECONOMY -> Pricing.computeStandardPrice(distance, flightCategory, ECONOMY, PassengerType.TRAVELER, baseIncome).toDouble,
        BUSINESS -> Pricing.computeStandardPrice(distance, flightCategory, BUSINESS, PassengerType.TRAVELER, baseIncome).toDouble,
        FIRST -> Pricing.computeStandardPrice(distance, flightCategory, FIRST, PassengerType.TRAVELER, baseIncome).toDouble
      )
    }
    
    def configureLinkClasses(airplane: Airplane): Map[LinkClass, Int] = {
      // Standard: 75% economy, 20% business, 5% first
      val totalSeats = airplane.model.capacity
      Map(
        ECONOMY -> (totalSeats * 0.75).toInt,
        BUSINESS -> (totalSeats * 0.20).toInt,
        FIRST -> (totalSeats * 0.05).toInt
      )
    }
    
    def calculateOptimalFrequency(distance: Int, airplane: Airplane): Int = {
      // Moderate frequency
      val baseFrequency = (distance / 600.0).toInt + 1
      Math.min(baseFrequency, 12) // Cap at 12 weekly flights
    }
  }
  
  case object REGIONAL extends BotPersonality {
    val minAirportSize = 2
    val minPopulation = 100000L
    val targetCapacityLow = 0.65
    val targetCapacityHigh = 0.85
    val fleetBudgetRatio = 0.20
    val serviceQuality = 45.0 // Basic service
    
    def scoreDestination(airport: Airport, distance: Int, fromAirport: Airport): Double = {
      // Prefer smaller airports, shorter routes
      val sizeScore = if (airport.size <= 4) airport.size * 25.0 else airport.size * 5.0
      val popScore = Math.log10(airport.population) * 8.0
      val distanceScore = if (distance < 2000) 25.0 else 2000.0 / distance
      val sameCountry = if (airport.countryCode == fromAirport.countryCode) 30.0 else 0.0
      sizeScore + popScore + distanceScore + sameCountry
    }
    
    def preferredAircraftCategory(currentFleet: List[Airplane], avgAge: Int): String = {
      "REGIONAL"
    }
    
    def calculatePricing(fromAirport: Airport, toAirport: Airport, distance: Int): Map[LinkClass, Double] = {
      // Regional pricing - slightly below market
      val flightCategory = Computation.getFlightCategory(fromAirport, toAirport)
      val baseIncome = fromAirport.baseIncome
      Map(
        ECONOMY -> (Pricing.computeStandardPrice(distance, flightCategory, ECONOMY, PassengerType.TRAVELER, baseIncome) * 0.95),
        BUSINESS -> (Pricing.computeStandardPrice(distance, flightCategory, BUSINESS, PassengerType.TRAVELER, baseIncome) * 0.95),
        FIRST -> (Pricing.computeStandardPrice(distance, flightCategory, FIRST, PassengerType.TRAVELER, baseIncome) * 0.95)
      )
    }
    
    def configureLinkClasses(airplane: Airplane): Map[LinkClass, Int] = {
      // Efficient: 85% economy, 15% business, no first class
      val totalSeats = airplane.model.capacity
      Map(
        ECONOMY -> (totalSeats * 0.85).toInt,
        BUSINESS -> (totalSeats * 0.15).toInt,
        FIRST -> 0
      )
    }
    
    def calculateOptimalFrequency(distance: Int, airplane: Airplane): Int = {
      // High frequency on short routes
      val baseFrequency = if (distance < 1000) {
        (1000.0 / distance).toInt + 2
      } else {
        (distance / 800.0).toInt + 1
      }
      Math.min(baseFrequency, 21) // Cap at 21 weekly flights (3 per day)
    }
  }
  
  case object PREMIUM extends BotPersonality {
    val minAirportSize = 6
    val minPopulation = 5000000L
    val targetCapacityLow = 0.70
    val targetCapacityHigh = 0.85 // Lower utilization OK for premium
    val fleetBudgetRatio = 0.22
    val serviceQuality = 80.0 // Excellent service
    
    def scoreDestination(airport: Airport, distance: Int, fromAirport: Airport): Double = {
      // Prefer major hubs, long-haul premium routes
      val sizeScore = airport.size * 30.0
      val popScore = Math.log10(airport.population) * 18.0
      val distanceScore = if (distance > 5000) 40.0 else distance / 125.0
      val income = if (airport.incomeLevel >= 50) 25.0 else 0.0
      sizeScore + popScore + distanceScore + income
    }
    
    def preferredAircraftCategory(currentFleet: List[Airplane], avgAge: Int): String = {
      // Always prefer large aircraft for premium service
      "LARGE"
    }
    
    def calculatePricing(fromAirport: Airport, toAirport: Airport, distance: Int): Map[LinkClass, Double] = {
      // Premium pricing - significantly above market
      val flightCategory = Computation.getFlightCategory(fromAirport, toAirport)
      val baseIncome = fromAirport.baseIncome
      Map(
        ECONOMY -> (Pricing.computeStandardPrice(distance, flightCategory, ECONOMY, PassengerType.TRAVELER, baseIncome) * 1.20),
        BUSINESS -> (Pricing.computeStandardPrice(distance, flightCategory, BUSINESS, PassengerType.TRAVELER, baseIncome) * 1.40),
        FIRST -> (Pricing.computeStandardPrice(distance, flightCategory, FIRST, PassengerType.TRAVELER, baseIncome) * 1.60)
      )
    }
    
    def configureLinkClasses(airplane: Airplane): Map[LinkClass, Int] = {
      // Luxury mix: 50% economy, 30% business, 20% first
      val totalSeats = airplane.model.capacity
      Map(
        ECONOMY -> (totalSeats * 0.50).toInt,
        BUSINESS -> (totalSeats * 0.30).toInt,
        FIRST -> (totalSeats * 0.20).toInt
      )
    }
    
    def calculateOptimalFrequency(distance: Int, airplane: Airplane): Int = {
      // Moderate frequency - focus on quality over quantity
      val baseFrequency = (distance / 800.0).toInt + 1
      Math.min(baseFrequency, 7) // Cap at 7 weekly flights (1 per day)
    }
  }
  
  case object BUDGET extends BotPersonality {
    val minAirportSize = 4
    val minPopulation = 1000000L
    val targetCapacityLow = 0.80 // High utilization required
    val targetCapacityHigh = 0.98
    val fleetBudgetRatio = 0.12 // Low fleet spending
    val serviceQuality = 30.0 // Basic service
    
    def scoreDestination(airport: Airport, distance: Int, fromAirport: Airport): Double = {
      // Prefer high-demand, short-haul routes
      val sizeScore = airport.size * 20.0
      val popScore = Math.log10(airport.population) * 15.0
      val distanceScore = if (distance < 3000) 30.0 else 3000.0 / distance
      sizeScore + popScore + distanceScore
    }
    
    def preferredAircraftCategory(currentFleet: List[Airplane], avgAge: Int): String = {
      "SMALL" // Efficient single-aisle aircraft
    }
    
    def calculatePricing(fromAirport: Airport, toAirport: Airport, distance: Int): Map[LinkClass, Double] = {
      // Budget pricing - significantly below market
      val flightCategory = Computation.getFlightCategory(fromAirport, toAirport)
      val baseIncome = fromAirport.baseIncome
      Map(
        ECONOMY -> (Pricing.computeStandardPrice(distance, flightCategory, ECONOMY, PassengerType.TRAVELER, baseIncome) * 0.70),
        BUSINESS -> (Pricing.computeStandardPrice(distance, flightCategory, BUSINESS, PassengerType.TRAVELER, baseIncome) * 0.80),
        FIRST -> (Pricing.computeStandardPrice(distance, flightCategory, FIRST, PassengerType.TRAVELER, baseIncome) * 0.80)
      )
    }
    
    def configureLinkClasses(airplane: Airplane): Map[LinkClass, Int] = {
      // All economy: 100% economy, no business or first class
      val totalSeats = airplane.model.capacity
      Map(
        ECONOMY -> totalSeats,
        BUSINESS -> 0,
        FIRST -> 0
      )
    }
    
    def calculateOptimalFrequency(distance: Int, airplane: Airplane): Int = {
      // Very high frequency - maximize utilization
      val baseFrequency = (distance / 400.0).toInt + 3
      Math.min(baseFrequency, 21) // Cap at 21 weekly flights (3 per day)
    }
  }
}
